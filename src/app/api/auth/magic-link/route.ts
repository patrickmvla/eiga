/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { users } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { MagicLinkRequestSchema } from "@/lib/validations/user.schema"
import { buildMagicLink } from "@/lib/auth/utils"
import { sendMagicLinkEmail } from "@/lib/email/send"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), {
    status: s,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })

const wantsJSON = (req: Request) =>
  (req.headers.get("accept") || "").includes("application/json") ||
  (req.headers.get("content-type") || "").includes("application/json")

const readPayload = async (req: Request) => {
  try {
    const form = await req.formData()
    return Object.fromEntries(form.entries() as any)
  } catch {
    return (await req.json().catch(() => ({}))) as Record<string, any>
  }
}

function loginUrl(req: Request, params: Record<string, string>) {
  const url = new URL("/login", req.url) // absolute URL (Next 15 requirement)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url
}

// Ensure the callback is safe: same origin and path-only; fallback to /dashboard
function sanitizeCallback(req: Request, cb?: string | null) {
  if (!cb) return "/dashboard"
  try {
    if (cb.startsWith("/")) return cb
    const base = new URL(req.url)
    const target = new URL(cb, base)
    if (target.origin === base.origin) {
      // reduce to path + query + hash
      return `${target.pathname}${target.search}${target.hash}`
    }
  } catch {
    // ignore and fallback
  }
  return "/dashboard"
}

export async function POST(req: Request) {
  const raw = await readPayload(req)

  const parsed = MagicLinkRequestSchema.safeParse(raw)
  if (!parsed.success) {
    if (wantsJSON(req)) {
      return toJSON({ ok: false, error: "invalid_email", issues: parsed.error.flatten() }, 400)
    }
    return NextResponse.redirect(loginUrl(req, { error: "invalid_email" }), 303)
  }

  const { email, callbackUrl } = parsed.data
  const safeCallback = sanitizeCallback(req, callbackUrl)

  // Find active user (don’t leak whether the email exists)
  // NOTE: if emails are stored lowercased, ensure client also lowercases; we compare as-is here.
  const row = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const u = row[0]

  if (u && u.isActive !== false) {
    const link = await buildMagicLink(
      {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role as "admin" | "member",
      },
      safeCallback
    )

    try {
      // Centralized email helper (logs in dev if RESEND_API_KEY is unset)
      await sendMagicLinkEmail(email, link)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[magic-link] email send failed:", e)
      }
      // Intentionally fall through to generic "sent" response to avoid enumeration
    }
  }

  if (wantsJSON(req)) {
    return toJSON({ ok: true, sent: true })
  }

  return NextResponse.redirect(loginUrl(req, { sent: "1" }), 303)
}
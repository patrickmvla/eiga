/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/suggestions/reject/route.ts
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { suggestions } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), {
    status: s,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const wantsJSON = (req: Request) =>
  (req.headers.get("accept") || "").includes("application/json") ||
  (req.headers.get("content-type") || "").includes("application/json");

// Next 15: redirects must be absolute
const abs = (req: Request, path: string) => new URL(path, req.url);

const readPayload = async (req: Request) => {
  try {
    const form = await req.formData();
    return Object.fromEntries(form.entries() as any);
  } catch {
    return (await req.json().catch(() => ({}))) as Record<string, any>;
  }
};

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect(abs(req, "/login"), 303);
  }

  const raw = await readPayload(req);
  const id = Number(raw?.suggestion_id);
  if (!Number.isFinite(id) || id <= 0) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid_id" }, 400)
      : NextResponse.redirect(abs(req, "/manage?err=invalid_id"), 303);
  }

  // Reject only if still pending (avoid clobbering selected/expired)
  const updated = await db
    .update(suggestions)
    .set({ status: "rejected" })
    .where(and(eq(suggestions.id, id), eq(suggestions.status, "pending")))
    .returning({ id: suggestions.id });

  if (updated.length === 0) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "not_pending" }, 409)
      : NextResponse.redirect(abs(req, "/manage?err=not_pending"), 303);
  }

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(abs(req, "/manage?rej=1"), 303);
}
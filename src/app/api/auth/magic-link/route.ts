/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { MagicLinkRequestSchema } from "@/lib/validations/user.schema";
import { buildMagicLink } from "@/lib/auth/utils";
import { sendMagicLinkEmail } from "@/lib/email/send";

function loginUrl(req: Request, params: Record<string, string>) {
  const url = new URL("/login", req.url); // absolute URL (Next 15 requirement)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const raw = form
    ? Object.fromEntries(form.entries() as any)
    : await req.json().catch(() => ({}));

  const parsed = MagicLinkRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(loginUrl(req, { error: "invalid_email" }), {
      status: 303,
    });
  }

  const { email, callbackUrl } = parsed.data;

  // Find active user (don’t leak whether the email exists)
  const row = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const u = row[0];

  if (u && u.isActive !== false) {
    const link = await buildMagicLink(
      {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role as "admin" | "member",
      },
      callbackUrl
    );

    try {
      // Centralized Resend helper (logs in dev if RESEND_API_KEY is unset)
      await sendMagicLinkEmail(email, link);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[magic-link] email send failed:", e);
      }
    }
  }

  return NextResponse.redirect(loginUrl(req, { sent: "1" }), { status: 303 });
}

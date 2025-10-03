/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { MagicLinkRequestSchema } from "@/lib/validations/user.schema";
import { buildMagicLink } from "@/lib/auth/utils";
import {
  EMAIL,
  magicLinkHtml,
  magicLinkSubject,
  magicLinkText,
} from "@/lib/auth/config";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const raw = form
    ? Object.fromEntries(form.entries() as any)
    : await req.json().catch(() => ({}));

  const parsed = MagicLinkRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect("/login?error=invalid_email", { status: 303 });
  }

  const { email, callbackUrl } = parsed.data;

  // Find active user (don’t leak whether the email exists)
  const row = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const u = row[0];

  let link: string | null = null;
  if (u && u.isActive !== false) {
    link = await buildMagicLink(
      {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role as "admin" | "member",
      },
      callbackUrl
    );

    // Send email via Resend (optional)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: EMAIL.from,
          to: [email],
          subject: magicLinkSubject(),
          text: magicLinkText(link),
          html: magicLinkHtml(link),
        });
      } else {
        // Dev fallback: log to console
        console.log("[magic-link]", link);
      }
    } catch (e) {
      console.warn("[magic-link] email send failed:", e);
    }
  }

  return NextResponse.redirect("/login?sent=1", { status: 303 });
}

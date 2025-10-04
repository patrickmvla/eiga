/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/auth/redeem-invite/route.ts
import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invites, users } from "@/drizzle/schema";
import { RedeemInviteSchema } from "@/lib/validations/user.schema";
import { buildMagicLink } from "@/lib/auth/utils";
import { sendMagicLinkEmail } from "@/lib/email/send";

const abs = (req: Request, path: string) => new URL(path, req.url);

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const raw = form
    ? Object.fromEntries(form.entries() as any)
    : await req.json().catch(() => ({}));

  const parsed = RedeemInviteSchema.safeParse(raw);
  if (!parsed.success) {
    const rawCode = typeof raw?.code === "string" ? raw.code : "";
    const dest = rawCode
      ? abs(req, `/invite/${encodeURIComponent(rawCode)}?status=invalid`)
      : abs(req, `/invite?status=invalid`);
    return NextResponse.redirect(dest, { status: 303 });
  }

  const { code, email, username } = parsed.data;

  // Check invite validity (unused & not expired)
  const now = new Date();
  const inv = await db
    .select()
    .from(invites)
    .where(and(eq(invites.code, code), isNull(invites.usedBy), gt(invites.expiresAt, now)))
    .limit(1);

  if (!inv[0]) {
    return NextResponse.redirect(abs(req, `/invite/${encodeURIComponent(code)}?status=expired`), { status: 303 });
  }

  // Uniqueness checks
  const emailExists = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (emailExists[0]) {
    return NextResponse.redirect(abs(req, `/invite/${encodeURIComponent(code)}?error=email_in_use`), { status: 303 });
  }

  const usernameExists = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (usernameExists[0]) {
    return NextResponse.redirect(abs(req, `/invite/${encodeURIComponent(code)}?error=username_in_use`), { status: 303 });
  }

  // Create the member
  const inserted = await db
    .insert(users)
    .values({
      email,
      username,
      role: "member",
      inviteCode: code,
      isActive: true,
    })
    .returning({ id: users.id, email: users.email, username: users.username });

  const newUser = inserted[0];
  if (!newUser) {
    return NextResponse.redirect(abs(req, `/invite/${encodeURIComponent(code)}?error=create_failed`), { status: 303 });
  }

  // Mark invite as used
  await db
    .update(invites)
    .set({ usedBy: newUser.id, usedAt: new Date() })
    .where(eq(invites.code, code));

  // Send magic link to confirm and sign in
  try {
    const link = await buildMagicLink(
      {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: "member",
      },
      "/dashboard"
    );
    await sendMagicLinkEmail(email, link);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[invite] failed to send magic link:", e);
    }
  }

  // Redirect to login with success notice
  return NextResponse.redirect(abs(req, "/login?sent=1"), { status: 303 });
}
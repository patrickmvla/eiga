/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/auth/redeem-invite/route.ts
import { NextResponse } from "next/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invites, users } from "@/drizzle/schema";
import { RedeemInviteSchema } from "@/lib/validations/user.schema";
import { buildMagicLink } from "@/lib/auth/utils";
import { sendMagicLinkEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const abs = (req: Request, path: string) => new URL(path, req.url);

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

const readPayload = async (req: Request) => {
  try {
    const form = await req.formData();
    return Object.fromEntries(form.entries() as any);
  } catch {
    return (await req.json().catch(() => ({}))) as Record<string, any>;
  }
};

export async function POST(req: Request) {
  const raw = await readPayload(req);

  const parsed = RedeemInviteSchema.safeParse(raw);
  if (!parsed.success) {
    const rawCode = typeof raw?.code === "string" ? raw.code : "";
    if (wantsJSON(req)) {
      return toJSON(
        { ok: false, error: "invalid", issues: parsed.error.flatten() },
        400
      );
    }
    const dest = rawCode
      ? abs(req, `/invite/${encodeURIComponent(rawCode)}?status=invalid`)
      : abs(req, `/invite?status=invalid`);
    return NextResponse.redirect(dest, 303);
  }

  const { code, email, username } = parsed.data;

  // Race-safe redeem in a transaction
  try {
    const newUser = await db.transaction(async (tx) => {
      // Lock the invite row to prevent concurrent redemption
      const locked = await tx.execute(sql`
        select code, used_by, expires_at
        from "invites"
        where "code" = ${code}
        for update
      `);

      const row: any =
        Array.isArray(locked) ? locked[0] : "rows" in (locked as any) ? (locked as any).rows?.[0] : null;

      if (!row) {
        throw Object.assign(new Error("invalid_code"), { status: 404, code: "invalid" as const });
      }

      const now = Date.now();
      const usedBy = row.used_by ?? row.usedBy ?? null;
      const expiresAt = new Date(row.expires_at ?? row.expiresAt ?? 0).getTime();

      if (usedBy) {
        throw Object.assign(new Error("already_used"), { status: 409, code: "used" as const });
      }
      if (expiresAt <= now) {
        throw Object.assign(new Error("expired"), { status: 410, code: "expired" as const });
      }

      // Uniqueness checks (preflight)
      const emailExists = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailExists.length > 0) {
        throw Object.assign(new Error("email_in_use"), { status: 409, code: "email_in_use" as const });
      }

      const usernameExists = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (usernameExists.length > 0) {
        throw Object.assign(new Error("username_in_use"), { status: 409, code: "username_in_use" as const });
      }

      // Create member
      const inserted = await tx
        .insert(users)
        .values({
          email,
          username,
          role: "member",
          inviteCode: code,
          isActive: true,
        })
        .returning({ id: users.id, email: users.email, username: users.username });

      const u = inserted[0];
      if (!u) {
        throw Object.assign(new Error("create_failed"), { status: 500, code: "create_failed" as const });
      }

      // Mark invite as used by the newly created user (locked row ensures consistency)
      const updated = await tx
        .update(invites)
        .set({ usedBy: u.id, usedAt: new Date() })
        .where(and(eq(invites.code, code), isNull(invites.usedBy), gt(invites.expiresAt, new Date())))
        .returning({ code: invites.code });

      if (updated.length === 0) {
        // Invite got claimed in the tiny gap — abort by throwing so tx rolls back user insert as well
        throw Object.assign(new Error("expired_or_used"), { status: 409, code: "expired" as const });
      }

      return u;
    });

    // Send magic link outside tx
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
      await sendMagicLinkEmail(newUser.email, link);
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[invite] failed to send magic link:", (e as Error).message);
      }
    }

    if (wantsJSON(req)) {
      return toJSON({ ok: true });
    }
    return NextResponse.redirect(abs(req, "/login?sent=1"), 303);
  } catch (e: any) {
    const codeParam = encodeURIComponent(parsed.data.code);
    const status = typeof e?.status === "number" ? e.status : 400;
    const errCode = (e?.code as string) || "invalid";

    if (wantsJSON(req)) {
      return toJSON({ ok: false, error: errCode }, status);
    }

    // Map to status/err query for UX
    let dest = `/invite/${codeParam}?status=invalid`;
    if (errCode === "expired") dest = `/invite/${codeParam}?status=expired`;
    if (errCode === "used") dest = `/invite/${codeParam}?status=used`;
    if (errCode === "email_in_use") dest = `/invite/${codeParam}?error=email_in_use`;
    if (errCode === "username_in_use") dest = `/invite/${codeParam}?error=username_in_use`;
    if (errCode === "create_failed") dest = `/invite/${codeParam}?error=create_failed`;

    return NextResponse.redirect(abs(req, dest), 303);
  }
}
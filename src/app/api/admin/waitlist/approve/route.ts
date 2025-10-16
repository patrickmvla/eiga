/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/waitlist/approve/route.ts
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invites } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";
import { AdminWaitlistApproveSchema } from "@/lib/validations/user.schema";
import { buildInviteRedeemUrl, generateInviteCode } from "@/lib/auth/config";
import { sendInviteEmail } from "@/lib/email/send";

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
  const id = Number(raw?.id);
  const expiresDays = Number(raw?.expires_in_days ?? raw?.expires_in_days?.value ?? 14);

  const parsed = AdminWaitlistApproveSchema.safeParse({
    id,
    expires_in_days: expiresDays,
  });
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid", issues: parsed.error.flatten() }, 400)
      : NextResponse.redirect(abs(req, "/invites?error=invalid"), 303);
  }

  // Read waitlist row if table exists (email only)
  let email = "";
  try {
    const rows: any = await db.execute(
      sql`select email from "waitlist" where id = ${parsed.data.id} limit 1`
    );
    if (Array.isArray(rows) && rows[0]) {
      email = rows[0].email || "";
    } else if ("rows" in (rows as any) && (rows as any).rows?.length) {
      email = (rows as any).rows[0].email || "";
    }
  } catch {
    // table might not exist; require email from UI later if needed
  }

  if (!email) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "no_email" }, 400)
      : NextResponse.redirect(abs(req, "/invites?error=no_email"), 303);
  }

  // Create invite code
  const code = generateInviteCode();
  const now = new Date();
  const exp = new Date(now);
  exp.setDate(exp.getDate() + parsed.data.expires_in_days);

  // Insert invite; if code collision (unlikely), retry once
  try {
    await db.insert(invites).values({
      code,
      createdBy: admin.user.id,
      expiresAt: exp,
    });
  } catch {
    // retry with a fresh code
    const code2 = generateInviteCode();
    await db.insert(invites).values({
      code: code2,
      createdBy: admin.user.id,
      expiresAt: exp,
    });
  }

  const redeem = buildInviteRedeemUrl(code);

  try {
    await sendInviteEmail(email, redeem, parsed.data.expires_in_days);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[waitlist:approve] email failed", (e as Error).message);
    }
    // still continue; admin can resend manually
  }

  // Best-effort status update if column exists
  try {
    await db.execute(
      sql`update "waitlist" set status = 'approved' where id = ${parsed.data.id}`
    );
  } catch {
    // ignore column/table issues in best-effort mode
  }

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(abs(req, "/invites?approved=1"), 303);
}
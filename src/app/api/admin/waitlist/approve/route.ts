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

const abs = (req: Request, path: string) => new URL(path, req.url);

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const form = await req.formData().catch(() => null);
  const id = Number(form?.get("id"));
  const expiresDays = Number(form?.get("expires_in_days") || "14");

  const parsed = AdminWaitlistApproveSchema.safeParse({
    id,
    expires_in_days: expiresDays,
  });
  if (!parsed.success) return toJSON({ ok: false, error: "invalid" }, 400);

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
    return toJSON({ ok: false, error: "no_email" }, 400);
  }

  // Create invite code
  const code = generateInviteCode();
  const now = new Date();
  const exp = new Date(now);
  exp.setDate(exp.getDate() + parsed.data.expires_in_days);

  await db.insert(invites).values({
    code,
    createdBy: admin.user.id,
    expiresAt: exp,
  });

  const redeem = buildInviteRedeemUrl(code);

  try {
    await sendInviteEmail(email, redeem, parsed.data.expires_in_days);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[waitlist:approve] email failed", e);
    }
  }

  // Best-effort status update if column exists
  try {
    await db.execute(
      sql`update "waitlist" set status = 'approved' where id = ${parsed.data.id}`
    );
  } catch {}

  return NextResponse.redirect(abs(req, "/invites?approved=1"), {
    status: 303,
  });
}

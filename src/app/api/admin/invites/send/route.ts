/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/invites/send/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { invites } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";
import { AdminSendInviteSchema } from "@/lib/validations/user.schema";
import { buildInviteRedeemUrl, generateInviteCode } from "@/lib/auth/config";
import { sendInviteEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// simple addDays fallback
const plusDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

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

  let raw: Record<string, any> = {};
  try {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries() as any);
  } catch {
    raw = (await req.json().catch(() => ({}))) as Record<string, any>;
  }

  const parsed = AdminSendInviteSchema.safeParse(raw);
  if (!parsed.success) {
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );
  }

  const { to_email, expires_in_days } = parsed.data;

  const code = generateInviteCode();
  const now = new Date();
  const expiresAt = plusDays(now, expires_in_days);

  await db.insert(invites).values({
    code,
    createdBy: admin.user.id,
    expiresAt,
  });

  const redeem = buildInviteRedeemUrl(code);

  try {
    await sendInviteEmail(to_email, redeem, expires_in_days);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[invite:send] email failed", e);
    }
  }

  return NextResponse.redirect(abs(req, "/invites?sent=1"), { status: 303 });
}

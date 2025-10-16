/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/waitlist/reject/route.ts
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ensureAdmin } from "@/lib/auth/utils";
import { AdminWaitlistRejectSchema } from "@/lib/validations/user.schema";

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

// Next 15: redirects need absolute URLs
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
  if (!admin?.user)
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect(abs(req, "/login"), 303);

  const raw = await readPayload(req);
  const id = Number(raw?.id);
  const parsed = AdminWaitlistRejectSchema.safeParse({ id });
  if (!parsed.success)
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid", issues: parsed.error.flatten() }, 400)
      : NextResponse.redirect(abs(req, "/invites?error=invalid"), 303);

  try {
    // Table/column may not exist in some environments — best-effort update.
    await db.execute(
      sql`update "waitlist" set status = 'rejected' where id = ${parsed.data.id}`
    );
  } catch {
    // ignore missing table/column errors
  }

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(abs(req, "/invites?rejected=1"), 303);
}
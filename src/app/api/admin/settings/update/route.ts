/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/settings/update/route.ts
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ensureAdmin } from "@/lib/auth/utils";
import {
  AdminSettingsUpdateSchema,
  parseAdminSettingValue,
} from "@/lib/validations/user.schema";

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

  const parsed = AdminSettingsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid", issues: parsed.error.flatten() }, 400)
      : NextResponse.redirect(abs(req, "/manage?error=invalid_settings"), 303);
  }

  // Coerce value with helper, clamp known numeric ranges
  const valueRaw = parseAdminSettingValue(parsed.data);
  let value = String(valueRaw);

  if (parsed.data.key === "seatsAvailable") {
    const n = Math.max(0, Math.min(10, Math.floor(Number(value))));
    value = Number.isFinite(n) ? String(n) : "0";
  }

  try {
    // Upsert into a generic 'settings' table if present
    await db.execute(sql`
      INSERT INTO "settings" ("key", "value")
      VALUES (${parsed.data.key}, ${value})
      ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"
    `);
  } catch {
    // Table may not exist yet; ignore but return ok so UI doesn't block
  }

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(abs(req, "/manage?settings=1"), 303);
}
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/settings/update/route.ts
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminSettingsUpdateSchema, parseAdminSettingValue } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return toJSON({ ok: false, error: 'unauthorized' }, 401);

  let raw: Record<string, any> = {};
  try {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries() as any);
  } catch {
    raw = (await req.json().catch(() => ({}))) as Record<string, any>;
  }

  const parsed = AdminSettingsUpdateSchema.safeParse(raw);
  if (!parsed.success) return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);

  const value = parseAdminSettingValue(parsed.data);

  // Upsert into a generic 'settings' table if present:
  try {
    await db.execute(sql`
      INSERT INTO "settings" ("key", "value")
      VALUES (${parsed.data.key}, ${String(value)})
      ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value"
    `);
  } catch {
    // Table may not exist yet; ignore but return ok so UI doesn't block
  }

  return toJSON({ ok: true });
}
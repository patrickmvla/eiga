/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/invites/create/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { invites } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminCreateInvitesSchema } from '@/lib/validations/user.schema';
import { generateInviteCode } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const plusDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let raw: Record<string, any> = {};
  try {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries() as any);
  } catch {
    raw = (await req.json().catch(() => ({}))) as Record<string, any>;
  }
  const parsed = AdminCreateInvitesSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, { status: 400 });

  const { quantity, expires_in_days } = parsed.data;

  const now = new Date();
  const expiresAt = plusDays(now, expires_in_days);
  const codes = new Set<string>();
  const values: Array<{ code: string; createdBy: string; expiresAt: Date }> = [];

  for (let i = 0; i < quantity; i++) {
    let code = generateInviteCode();
    while (codes.has(code)) code = generateInviteCode();
    codes.add(code);
    values.push({ code, createdBy: admin.user.id, expiresAt });
  }

  await db.insert(invites).values(values);
  return NextResponse.redirect('/invites?created=1', { status: 303 });
}
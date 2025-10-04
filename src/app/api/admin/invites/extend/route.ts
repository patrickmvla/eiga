// app/api/admin/invites/extend/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { invites } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminInviteExtendSchema } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const code = (form?.get('code') || '').toString();
  const extendDays = Number(form?.get('extend_days') || '0');

  const parsed = AdminInviteExtendSchema.safeParse({ code, extend_days: extendDays });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  const row = await db.select({ expiresAt: invites.expiresAt }).from(invites).where(eq(invites.code, parsed.data.code)).limit(1);
  const base = row[0]?.expiresAt ? new Date(row[0].expiresAt) : new Date();
  const newExp = new Date(Math.max(Date.now(), base.getTime()));
  newExp.setDate(newExp.getDate() + parsed.data.extend_days);

  await db.update(invites).set({ expiresAt: newExp }).where(eq(invites.code, parsed.data.code));
  return NextResponse.redirect('/invites?extended=1', { status: 303 });
}
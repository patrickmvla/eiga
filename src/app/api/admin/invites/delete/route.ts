// app/api/admin/invites/delete/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { invites } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminInviteDeleteSchema } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const code = (form?.get('code') || '').toString();
  const parsed = AdminInviteDeleteSchema.safeParse({ code });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  await db.delete(invites).where(eq(invites.code, parsed.data.code));
  return NextResponse.redirect('/invites?deleted=1', { status: 303 });
}
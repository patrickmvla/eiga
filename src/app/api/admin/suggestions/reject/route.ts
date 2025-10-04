// app/api/admin/suggestions/reject/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { suggestions } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const id = Number(form?.get('suggestion_id'));
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  await db.update(suggestions).set({ status: 'rejected' }).where(eq(suggestions.id, id));

  return NextResponse.redirect('/manage?rej=1', { status: 303 });
}
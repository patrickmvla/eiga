// app/api/admin/flags/resolve/route.ts
import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // No flags table yet — resolve is a no-op placeholder.
  return NextResponse.json({ ok: true });
}
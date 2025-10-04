// app/api/admin/films/publish-verdict/route.ts
import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/lib/auth/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // Placeholder: You can store a verdict blob in a future 'verdicts' table or films.adminNotes.
  // Current UI just triggers an action — so we acknowledge success.
  return NextResponse.redirect('/manage?verdict=1', { status: 303 });
}
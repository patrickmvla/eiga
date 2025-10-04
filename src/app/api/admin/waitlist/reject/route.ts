// app/api/admin/waitlist/reject/route.ts
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminWaitlistRejectSchema } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const id = Number(form?.get('id'));
  const parsed = AdminWaitlistRejectSchema.safeParse({ id });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  try {
    await db.execute(sql`update "waitlist" set status = 'rejected' where id = ${parsed.data.id}`);
  } catch {
    // table/column may not exist; ignore
  }

  return NextResponse.redirect('/invites?rejected=1', { status: 303 });
}
// app/api/admin/members/remove/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminMemberRemoveSchema } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return toJSON({ ok: false, error: 'unauthorized' }, 401);

  const form = await req.formData().catch(() => null);
  const userId = (form?.get('user_id') || '').toString();
  const parsed = AdminMemberRemoveSchema.safeParse({ user_id: userId });
  if (!parsed.success) return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);

  // Soft-remove: mark inactive (keeps history)
  await db.update(users).set({ isActive: false }).where(eq(users.id, parsed.data.user_id));

  return toJSON({ ok: true });
}
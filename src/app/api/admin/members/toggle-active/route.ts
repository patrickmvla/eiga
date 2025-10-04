/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/members/toggle-active/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminMemberToggleActiveSchema } from '@/lib/validations/user.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

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
  if (!admin?.user) return toJSON({ ok: false, error: 'unauthorized' }, 401);

  const raw = await readPayload(req);
  const parsed = AdminMemberToggleActiveSchema.safeParse(raw);
  if (!parsed.success) return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);

  const { user_id, set_active } = parsed.data;
  await db.update(users).set({ isActive: !!set_active }).where(eq(users.id, user_id));

  return toJSON({ ok: true });
}
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/flags/highlight/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { discussions } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { AdminHighlightDiscussionSchema } from '@/lib/validations/discussion.schema';
import { notifyHighlightUpdate } from '@/lib/realtime/server';

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

  const parsed = AdminHighlightDiscussionSchema.safeParse(raw);
  if (!parsed.success) return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);

  const { item_id, highlight } = parsed.data;

  const row = await db
    .select({ id: discussions.id, filmId: discussions.filmId })
    .from(discussions)
    .where(eq(discussions.id, item_id))
    .limit(1);

  if (!row[0]) return toJSON({ ok: false, error: 'not_found' }, 404);

  await db.update(discussions).set({ isHighlighted: !!highlight }).where(eq(discussions.id, item_id));
  await notifyHighlightUpdate(row[0].filmId, item_id, !!highlight);

  return toJSON({ ok: true });
}
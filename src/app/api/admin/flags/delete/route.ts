/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/flags/delete/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { discussions } from '@/drizzle/schema';
import { ensureAdmin } from '@/lib/auth/utils';
import { notifyDiscussionUpdate } from '@/lib/realtime/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), {
    status: s,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

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
  const id = Number(raw?.item_id);
  const type = String(raw?.type || '');

  if (!Number.isFinite(id) || id <= 0 || !type) {
    return toJSON({ ok: false, error: 'invalid' }, 400);
  }

  if (type === 'comment') {
    // Fetch filmId first so we can broadcast after deletion
    const row = await db
      .select({ filmId: discussions.filmId })
      .from(discussions)
      .where(eq(discussions.id, id))
      .limit(1);

    // Delete the comment (children will cascade via FK if configured)
    await db.delete(discussions).where(eq(discussions.id, id));

    // Broadcast an update so clients can invalidate discussion queries
    if (row[0]?.filmId) {
      try {
        await notifyDiscussionUpdate(row[0].filmId, id);
      } catch {
        // ignore realtime failures
      }
    }

    return toJSON({ ok: true });
  }

  // If you later support 'review', handle ratings table deletions here.
  return toJSON({ ok: false, error: 'unsupported_type' }, 400);
}
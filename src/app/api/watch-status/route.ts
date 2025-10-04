/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/watch-status/route.ts
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { watchStatus } from '@/drizzle/schema';
import { auth } from '@/lib/auth/utils';
import { WatchStatusUpdateSchema } from '@/lib/validations/film.schema';

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
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: 'unauthorized' }, 401);

  const raw = await readPayload(req);
  const parsed = WatchStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);

  const { film_id, status } = parsed.data;

  // Upsert by PK (userId, filmId)
  const existing = await db
    .select({ userId: watchStatus.userId, filmId: watchStatus.filmId })
    .from(watchStatus)
    .where(and(eq(watchStatus.userId, session.user.id), eq(watchStatus.filmId, film_id)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(watchStatus)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(watchStatus.userId, session.user.id), eq(watchStatus.filmId, film_id)));
  } else {
    await db.insert(watchStatus).values({
      userId: session.user.id,
      filmId: film_id,
      status,
    });
  }

  return toJSON({ ok: true });
}
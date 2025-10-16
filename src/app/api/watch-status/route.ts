/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/watch-status/route.ts
import { watchStatus } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import { db } from "@/lib/db/client";
import { WatchStatusUpdateSchema } from "@/lib/validations/film.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toJSON = (b: unknown, s = 200) =>
  new NextResponse(JSON.stringify(b), {
    status: s,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
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
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = WatchStatusUpdateSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { film_id, status } = parsed.data;

  // Race-safe upsert using composite PK (userId, filmId)
  await db
    .insert(watchStatus)
    .values({
      userId: session.user.id,
      filmId: film_id,
      status,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [watchStatus.userId, watchStatus.filmId],
      set: {
        status,
        updatedAt: new Date(),
      },
    });

  return toJSON({ ok: true });
}
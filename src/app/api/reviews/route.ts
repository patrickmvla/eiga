/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ratings } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import {
  RatingCreateSchema,
  RatingEditSchema,
} from "@/lib/validations/film.schema";
import { notifyRatingNew, notifyRatingUpdate } from "@/lib/realtime/server";

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
const wantsJSON = (req: Request) =>
  (req.headers.get("accept") || "").includes("application/json") ||
  (req.headers.get("content-type") || "").includes("application/json");

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
  if (!session?.user)
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect("/login", { status: 303 });

  const raw = await readPayload(req);
  const parsed = RatingCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect("/", { status: 303 });
  }

  const { film_id, score, review } = parsed.data;

  // Upsert (create or update existing row)
  const existing = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(
      and(eq(ratings.userId, session.user.id), eq(ratings.filmId, film_id))
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(ratings)
      .set({ score, review, updatedAt: new Date() })
      .where(eq(ratings.id, existing[0].id));
    await notifyRatingUpdate(film_id, session.user.username);
  } else {
    await db.insert(ratings).values({
      userId: session.user.id,
      filmId: film_id,
      score,
      review,
      watchedAt: new Date(),
    });
    await notifyRatingNew(film_id, session.user.username);
  }

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(`/films/${film_id}?reviewed=1`, { status: 303 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = RatingEditSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { film_id, score, review } = parsed.data;

  const row = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(
      and(eq(ratings.userId, session.user.id), eq(ratings.filmId, film_id))
    )
    .limit(1);

  if (row.length === 0) return toJSON({ ok: false, error: "not_found" }, 404);

  await db
    .update(ratings)
    .set({
      score: score ?? undefined,
      review: review ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(ratings.id, row[0].id));

  await notifyRatingUpdate(film_id, session.user.username);
  return toJSON({ ok: true });
}

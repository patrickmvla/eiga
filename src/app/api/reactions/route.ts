/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/reactions/route.ts
import { discussions, reactions } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import { db } from "@/lib/db/client";
import { notifyReactionNew, notifyReactionRemove } from "@/lib/realtime/server";
import {
  ReactionAddSchema,
  ReactionRemoveSchema,
} from "@/lib/validations/discussion.schema";
import { and, eq } from "drizzle-orm";
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

const getDiscussionFilm = async (discussionId: number) => {
  const row = await db
    .select({ filmId: discussions.filmId })
    .from(discussions)
    .where(eq(discussions.id, discussionId))
    .limit(1);
  return row[0]?.filmId ?? null;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = ReactionAddSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { discussion_id, type } = parsed.data;
  const filmId = await getDiscussionFilm(discussion_id);
  if (!filmId) return toJSON({ ok: false, error: "not_found" }, 404);

  // Single upsert (race-safe). Return a flag indicating if type changed.
  // We detect change by comparing with previous stored type.
  const prev = await db
    .select({ id: reactions.id, type: reactions.type })
    .from(reactions)
    .where(
      and(
        eq(reactions.userId, session.user.id),
        eq(reactions.discussionId, discussion_id)
      )
    )
    .limit(1);

  await db
    .insert(reactions)
    .values({
      userId: session.user.id,
      discussionId: discussion_id,
      type,
    })
    .onConflictDoUpdate({
      target: [reactions.userId, reactions.discussionId], // unique index
      set: { type },
    });

  // Only notify on create or when type actually changed
  const created = prev.length === 0;
  const changed = created || prev[0].type !== type;
  if (changed) {
    try {
      await notifyReactionNew(filmId, discussion_id, session.user.username, type);
    } catch {
      // ignore realtime failures
    }
  }

  return toJSON({ ok: true, created, changed });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = ReactionRemoveSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { discussion_id } = parsed.data;
  const filmId = await getDiscussionFilm(discussion_id);
  if (!filmId) return toJSON({ ok: false, error: "not_found" }, 404);

  const deleted = await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.userId, session.user.id),
        eq(reactions.discussionId, discussion_id)
      )
    )
    .returning({ id: reactions.id });

  if (deleted.length > 0) {
    try {
      await notifyReactionRemove(filmId, discussion_id, session.user.username);
    } catch {
      // ignore realtime failures
    }
  }

  return toJSON({ ok: true, removed: deleted.length > 0 });
}
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/discussions/route.ts
import { discussions } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import { db } from "@/lib/db/client";
import {
    notifyDiscussionNew,
    notifyDiscussionUpdate,
} from "@/lib/realtime/server";
import {
    DiscussionCreateSchema,
    DiscussionDeleteSchema,
    DiscussionEditSchema,
} from "@/lib/validations/discussion.schema";
import { eq } from "drizzle-orm";
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
  if (!session?.user) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect("/login", { status: 303 });
  }
  const raw = await readPayload(req);
  // Empty string parent_id means "thread" → drop it
  if (raw?.parent_id === "") delete raw.parent_id;

  const parsed = DiscussionCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect("/", { status: 303 });
  }

  const { film_id, parent_id, content, has_spoilers, timestamp_reference } =
    parsed.data;

  // Enforce max depth = 2 (server check)
  if (parent_id) {
    const parent = await db
      .select({ id: discussions.id, parentId: discussions.parentId })
      .from(discussions)
      .where(eq(discussions.id, parent_id))
      .limit(1);
    if (parent.length === 0)
      return toJSON({ ok: false, error: "parent_not_found" }, 404);
    if (parent[0].parentId != null)
      return toJSON({ ok: false, error: "max_depth" }, 400);
  }

  const inserted = await db
    .insert(discussions)
    .values({
      filmId: film_id,
      userId: session.user.id,
      parentId: parent_id ?? null,
      content,
      hasSpoilers: Boolean(has_spoilers),
      timestampReference:
        typeof timestamp_reference === "number" ? timestamp_reference : null,
      isHighlighted: false,
    })
    .returning({ id: discussions.id });

  const newId = inserted[0]?.id;
  if (newId) await notifyDiscussionNew(film_id, newId);

  return wantsJSON(req)
    ? toJSON({ ok: true, id: newId })
    : NextResponse.redirect(`/films/${film_id}`, { status: 303 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = DiscussionEditSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { id, content, has_spoilers, timestamp_reference } = parsed.data;

  const row = await db
    .select({
      id: discussions.id,
      userId: discussions.userId,
      filmId: discussions.filmId,
    })
    .from(discussions)
    .where(eq(discussions.id, id))
    .limit(1);

  if (row.length === 0) return toJSON({ ok: false, error: "not_found" }, 404);
  const isOwner = row[0].userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin)
    return toJSON({ ok: false, error: "forbidden" }, 403);

  await db
    .update(discussions)
    .set({
      content: typeof content === "string" ? content : undefined,
      hasSpoilers: typeof has_spoilers === "boolean" ? has_spoilers : undefined,
      timestampReference:
        typeof timestamp_reference === "number"
          ? timestamp_reference
          : undefined,
      editedAt: new Date(),
    })
    .where(eq(discussions.id, id));

  await notifyDiscussionUpdate(row[0].filmId, id);
  return toJSON({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const raw = await readPayload(req);
  const parsed = DiscussionDeleteSchema.safeParse(raw);
  if (!parsed.success)
    return toJSON(
      { ok: false, error: "invalid", issues: parsed.error.flatten() },
      400
    );

  const { id } = parsed.data;

  const row = await db
    .select({
      id: discussions.id,
      userId: discussions.userId,
      filmId: discussions.filmId,
    })
    .from(discussions)
    .where(eq(discussions.id, id))
    .limit(1);

  if (row.length === 0) return toJSON({ ok: false, error: "not_found" }, 404);
  const isOwner = row[0].userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin)
    return toJSON({ ok: false, error: "forbidden" }, 403);

  await db.delete(discussions).where(eq(discussions.id, id));
  await notifyDiscussionUpdate(row[0].filmId, id);
  return toJSON({ ok: true });
}

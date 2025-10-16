/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import { ProfileUpdateSchema } from "@/lib/validations/user.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const abs = (req: Request, path: string) => new URL(path, req.url);

const toJSON = (body: unknown, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
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
      : NextResponse.redirect(abs(req, "/login?callbackUrl=/dashboard"), 303);
  }

  const raw = await readPayload(req);
  const currentUsername = String(raw?.current_username || "");

  // Authorization: you can edit yourself, or be admin
  const isAdmin = session.user.role === "admin";
  const isMe =
    session.user.username.toLowerCase() === currentUsername.toLowerCase();
  if (!isMe && !isAdmin) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "forbidden" }, 403)
      : NextResponse.redirect(
          abs(req, `/profile/${currentUsername}?error=forbidden`),
          303
        );
  }

  const parsed = ProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect(
          abs(req, `/profile/${currentUsername}/edit?error=invalid`),
          303
        );
  }

  const { username, avatar_url } = parsed.data;

  // Load current user row by current username
  const rows = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, currentUsername))
    .limit(1);
  const me = rows[0];
  if (!me) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "server" }, 500)
      : NextResponse.redirect(
          abs(req, `/profile/${currentUsername}?error=server`),
          303
        );
  }

  // Prepare update set (only supported fields in schema)
  const nextUsername = (username ?? "").trim();
  const wantsUsernameChange =
    nextUsername.length > 0 &&
    nextUsername.toLowerCase() !== currentUsername.toLowerCase();

  // If username change, enforce uniqueness
  if (wantsUsernameChange) {
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, nextUsername), ne(users.id, me.id)))
      .limit(1);
    if (taken.length > 0) {
      return wantsJSON(req)
        ? toJSON({ ok: false, error: "username_in_use" }, 409)
        : NextResponse.redirect(
            abs(req, `/profile/${currentUsername}/edit?error=username_in_use`),
            303
          );
    }
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (wantsUsernameChange) patch.username = nextUsername;
  if (typeof avatar_url === "string")
    patch.avatarUrl = avatar_url.length ? avatar_url : null;

  if (Object.keys(patch).length === 0) {
    // Nothing to update; just redirect back with success or return JSON
    return wantsJSON(req)
      ? toJSON({ ok: true, unchanged: true, username: currentUsername })
      : NextResponse.redirect(
          abs(req, `/profile/${currentUsername}?saved=1`),
          303
        );
  }

  try {
    await db.update(users).set(patch).where(eq(users.id, me.id));
  } catch {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "server" }, 500)
      : NextResponse.redirect(
          abs(req, `/profile/${currentUsername}/edit?error=server`),
          303
        );
  }

  const destUsername = patch.username ?? currentUsername;
  return wantsJSON(req)
    ? toJSON({ ok: true, username: destUsername })
    : NextResponse.redirect(abs(req, `/profile/${destUsername}?saved=1`), 303);
}
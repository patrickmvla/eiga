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
    return NextResponse.redirect(abs(req, "/login?callbackUrl=/dashboard"), { status: 303 });
  }

  const raw = await readPayload(req);
  const currentUsername = String(raw?.current_username || "");

  // Authorization: you can edit yourself, or be admin
  const isAdmin = session.user.role === "admin";
  const isMe = session.user.username.toLowerCase() === currentUsername.toLowerCase();
  if (!isMe && !isAdmin) {
    return NextResponse.redirect(abs(req, `/profile/${currentUsername}?error=forbidden`), { status: 303 });
  }

  const parsed = ProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(abs(req, `/profile/${currentUsername}/edit?error=invalid`), { status: 303 });
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
    return NextResponse.redirect(abs(req, `/profile/${currentUsername}?error=server`), { status: 303 });
  }

  // Prepare update set (only supported fields in schema)
  const nextUsername = (username ?? "").trim();
  const wantsUsernameChange =
    nextUsername.length > 0 && nextUsername.toLowerCase() !== currentUsername.toLowerCase();

  // If username change, enforce uniqueness
  if (wantsUsernameChange) {
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, nextUsername), ne(users.id, me.id)))
      .limit(1);
    if (taken.length > 0) {
      return NextResponse.redirect(abs(req, `/profile/${currentUsername}/edit?error=username_in_use`), { status: 303 });
    }
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (wantsUsernameChange) patch.username = nextUsername;
  if (typeof avatar_url === "string") patch.avatarUrl = avatar_url.length ? avatar_url : null;

  if (Object.keys(patch).length === 0) {
    // Nothing to update; just redirect back with success
    const dest = abs(req, `/profile/${currentUsername}?saved=1`);
    return NextResponse.redirect(dest, { status: 303 });
  }

  try {
    await db.update(users).set(patch).where(eq(users.id, me.id));
  } catch {
    return NextResponse.redirect(abs(req, `/profile/${currentUsername}/edit?error=server`), { status: 303 });
  }

  const destUsername = patch.username ?? currentUsername;
  return NextResponse.redirect(abs(req, `/profile/${destUsername}?saved=1`), { status: 303 });
}
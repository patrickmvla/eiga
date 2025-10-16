/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth/utils";
import { normalizeCallbackUrl, DEFAULT_CALLBACK_PATH } from "@/lib/auth/config";
import { jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enc = new TextEncoder();
const secret = (
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  ""
).toString();

// Next 15: redirects must use absolute URLs
const abs = (req: Request, pathOrUrl: string) => new URL(pathOrUrl, req.url);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const callbackUrl =
    url.searchParams.get("callbackUrl") || DEFAULT_CALLBACK_PATH;

  // Verify short-lived magic token
  let payload: any = null;
  try {
    if (!secret) throw new Error("missing_secret");
    const res = await jwtVerify(token, enc.encode(secret));
    payload = res.payload;
  } catch {
    return NextResponse.redirect(abs(req, "/login?error=invalid_token"), 303);
  }

  if (!payload?.sub || payload?.purpose !== "magic") {
    return NextResponse.redirect(abs(req, "/login?error=invalid_token"), 303);
  }

  // Ensure user exists and active
  const row = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      avatar_url: users.avatarUrl,
      is_active: users.isActive,
    })
    .from(users)
    .where(eq(users.id, payload.sub as string))
    .limit(1);

  const u = row[0];
  if (!u || u.is_active === false) {
    return NextResponse.redirect(abs(req, "/login?error=inactive"), 303);
  }

  // Create long-lived session cookie
  await createSession({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role as "admin" | "member",
    avatar_url: u.avatar_url,
    is_active: u.is_active ?? true,
  });

  // Normalize callback (restrict to same-origin/path), then redirect absolutely
  const destPath = normalizeCallbackUrl(callbackUrl);
  return NextResponse.redirect(abs(req, destPath), 303);
}

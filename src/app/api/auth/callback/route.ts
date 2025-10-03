// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth/utils';
import { normalizeCallbackUrl, DEFAULT_CALLBACK_PATH } from '@/lib/auth/config';
import { jwtVerify } from 'jose';

const enc = new TextEncoder();
const secret = (process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '').toString();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const callbackUrl = url.searchParams.get('callbackUrl') || DEFAULT_CALLBACK_PATH;

  // Verify short-lived magic token
  let payload: any = null;
  try {
    const res = await jwtVerify(token, enc.encode(secret));
    payload = res.payload;
  } catch {
    return NextResponse.redirect('/login?error=invalid_token', { status: 303 });
  }

  if (!payload?.sub || payload?.purpose !== 'magic') {
    return NextResponse.redirect('/login?error=invalid_token', { status: 303 });
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
    return NextResponse.redirect('/login?error=inactive', { status: 303 });
  }

  // Create long-lived session cookie
  await createSession({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role as 'admin' | 'member',
    avatar_url: u.avatar_url,
    is_active: u.is_active ?? true,
  });

  const dest = normalizeCallbackUrl(callbackUrl);
  return NextResponse.redirect(dest, { status: 303 });
}
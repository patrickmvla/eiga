// lib/auth/utils.ts
import 'dotenv/config';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { db } from '@/lib/db/client';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  AUTH_SECRET as AUTH_SECRET_RAW,
  BASE_URL,
  DEFAULT_CALLBACK_PATH,
  normalizeCallbackUrl,
} from './config';

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'member';
  avatar_url?: string | null;
  is_active?: boolean;
};

export type Session = { user: SessionUser };

const COOKIE_NAME = 'eiga_session';
const SESSION_TTL_DAYS = 30;

const enc = new TextEncoder();
const AUTH_SECRET = AUTH_SECRET_RAW || process.env.AUTH_SECRET || '';
if (!AUTH_SECRET) {
  console.warn('[auth] Missing AUTH secret. Set BETTER_AUTH_SECRET or AUTH_SECRET.');
}

const sign = async (claims: JWTPayload, ttlSec: number) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(enc.encode(AUTH_SECRET));

const verify = async <T extends JWTPayload>(token: string): Promise<T | null> => {
  try {
    const { payload } = await jwtVerify<T>(token, enc.encode(AUTH_SECRET));
    return payload;
  } catch {
    return null;
  }
};

const cookieOptions = (maxAgeSec: number) => ({
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV !== 'development',
  path: '/',
  maxAge: maxAgeSec,
});

/** Server-side session getter (use in layouts/pages). */
export const auth = async (): Promise<Session | null> => {
  const c = cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verify<{ sub: string } & SessionUser>(token);
  if (!payload?.sub) return null;

  // Ensure user still exists and is active
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
    .where(eq(users.id, payload.sub))
    .limit(1);

  const u = row[0];
  if (!u || u.is_active === false) return null;

  return {
    user: {
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role as SessionUser['role'],
      avatar_url: u.avatar_url ?? null,
      is_active: u.is_active ?? true,
    },
  };
};

export const createSession = async (user: SessionUser) => {
  const ttlSec = SESSION_TTL_DAYS * 24 * 60 * 60;
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    ttlSec
  );
  cookies().set(COOKIE_NAME, token, cookieOptions(ttlSec));
};

export const destroySession = async () => {
  cookies().set(COOKIE_NAME, '', { ...cookieOptions(0), maxAge: 0 });
};

/** Build a magic-link token (short-lived) and return the full callback URL */
export const buildMagicLink = async (user: SessionUser, callbackUrl?: string) => {
  const ttlMin = 15;
  const token = await sign(
    { sub: user.id, email: user.email, purpose: 'magic' },
    ttlMin * 60
  );
  const url = new URL('/api/auth/callback', BASE_URL);
  url.searchParams.set('token', token);
  const cb = normalizeCallbackUrl(callbackUrl || DEFAULT_CALLBACK_PATH);
  url.searchParams.set('callbackUrl', cb);
  return url.toString();
};

/** Guard for admin-only server routes/pages (returns session or null) */
export const ensureAdmin = async (): Promise<Session | null> => {
  const s = await auth();
  return s?.user.role === 'admin' ? s : null;
};
// lib/auth/config.ts

// Centralized auth + invites configuration and helpers.
// This file is provider-agnostic (works with the current mock auth).
// When you wire Better-Auth, you can import from here (baseUrl, defaultCallback, templates, etc.).

/* App identity */
export const APP_NAME = 'Eiga';

/* Base URL detection */
const inferBaseUrl = (): string => {
  // Preferred explicit env
  const explicit =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    '';

  if (explicit) return explicit.replace(/\/$/, '');

  // Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // Fallback local
  return 'http://localhost:3000';
};

export const BASE_URL = inferBaseUrl();

/* Secrets (for future provider integration) */
export const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '';

/* Defaults */
export const DEFAULT_CALLBACK_PATH = '/dashboard';
export const SAME_ORIGIN_REDIRECT = true; // clamp callbackUrl to same origin for safety

/* Magic link policy */
export const MAGIC_LINK = {
  ttlMinutes: 15,
  callbackPath: '/api/auth/callback', // where your future provider will verify the token
};

/* Invite policy */
export const INVITES = {
  expiresInDaysDefault: 14,
  // Pattern: 3–5 groups of 4 uppercase alphanumerics separated by dashes, optional prefix like EIGA-
  pattern: /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,4}$|^EIGA-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){1,4}$/,
};

/* Email settings */
export const EMAIL = {
  from:
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    'Eiga <no-reply@eiga.local>',
  replyTo: process.env.EMAIL_REPLY_TO || process.env.ADMIN_EMAIL || undefined,
};

/* URL helpers */
export const ensureAbsoluteUrl = (pathOrUrl: string): string => {
  try {
    const u = new URL(pathOrUrl);
    return u.toString();
  } catch {
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${BASE_URL}${path}`;
  }
};

export const normalizeCallbackUrl = (
  input: string | undefined | null,
  fallbackPath = DEFAULT_CALLBACK_PATH
): string => {
  const fallbackAbs = ensureAbsoluteUrl(fallbackPath);
  if (!input || input.length === 0) return fallbackAbs;

  try {
    const u = new URL(input, BASE_URL);
    if (!SAME_ORIGIN_REDIRECT) return u.toString();

    // Same-origin enforcement
    const base = new URL(BASE_URL);
    if (u.origin !== base.origin) return fallbackAbs;

    // Only allow same-origin
    return u.toString();
  } catch {
    return fallbackAbs;
  }
};

export const buildLoginUrl = (callbackPath?: string): string => {
  const url = new URL('/login', BASE_URL);
  const cb = callbackPath ? normalizeCallbackUrl(callbackPath) : ensureAbsoluteUrl(DEFAULT_CALLBACK_PATH);
  url.searchParams.set('callbackUrl', cb);
  return url.toString();
};

export const buildInviteRedeemUrl = (code: string): string =>
  ensureAbsoluteUrl(`/invite/${encodeURIComponent(code)}`);

/* Email templates (simple, provider-agnostic) */
export const magicLinkSubject = (appName = APP_NAME) =>
  `Your ${appName} sign-in link`;

export const magicLinkText = (link: string, ttl = MAGIC_LINK.ttlMinutes) =>
  `Use this link to sign in. It expires in ${ttl} minutes:\n\n${link}\n\nIf you didn’t request this, you can ignore this email.`;

export const magicLinkHtml = (link: string, ttl = MAGIC_LINK.ttlMinutes) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${APP_NAME} Sign-in</title>
</head>
<body style="font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0a0a0a; color:#e5e5e5; padding:24px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="font-size:18px; margin:0 0 12px;">Sign in to ${APP_NAME}</h1>
    <p style="margin:0 0 16px;">Use the button below to sign in. This link expires in ${ttl} minutes.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:#9fbb68;color:#0a0a0a;text-decoration:none;font-weight:600;padding:10px 14px;border-radius:8px;">Sign in</a>
    </p>
    <p style="font-size:12px;color:#a3a3a3;margin-top:24px;">If the button doesn’t work, copy and paste this URL:</p>
    <p style="font-size:12px;word-break:break-all;color:#a3a3a3;">${link}</p>
  </div>
</body>
</html>`;

export const inviteSubject = (appName = APP_NAME) =>
  `Your invitation to ${appName}`;

export const inviteText = (redeemUrl: string, expiresInDays = INVITES.expiresInDaysDefault) =>
  `You’ve been invited to ${APP_NAME}. Use this link to redeem your invite. It expires in ${expiresInDays} days:\n\n${redeemUrl}\n\nIf you weren’t expecting this, you can ignore this email.`;

export const inviteHtml = (redeemUrl: string, expiresInDays = INVITES.expiresInDaysDefault) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${APP_NAME} Invitation</title>
</head>
<body style="font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0a0a0a; color:#e5e5e5; padding:24px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="font-size:18px; margin:0 0 12px;">You’re invited to ${APP_NAME}</h1>
    <p style="margin:0 0 16px;">We keep it small for thoughtful discourse. Use the button below to redeem your invite. This expires in ${expiresInDays} days.</p>
    <p style="margin:24px 0;">
      <a href="${redeemUrl}" style="display:inline-block;background:#9fbb68;color:#0a0a0a;text-decoration:none;font-weight:600;padding:10px 14px;border-radius:8px;">Redeem invite</a>
    </p>
    <p style="font-size:12px;color:#a3a3a3;margin-top:24px;">If the button doesn’t work, copy and paste this URL:</p>
    <p style="font-size:12px;word-break:break-all;color:#a3a3a3;">${redeemUrl}</p>
  </div>
</body>
</html>`;

/* Validation helpers */
export const isValidInviteCode = (code: string): boolean =>
  INVITES.pattern.test(code.trim().toUpperCase());

/* Utility to build a magic-link destination URL (for the email link)
   token: opaque token generated by your future auth provider
   callbackPath: optional path to redirect after verification (clamped to same-origin)
*/
export const buildMagicLinkUrl = (token: string, callbackPath?: string): string => {
  const url = new URL(MAGIC_LINK.callbackPath, BASE_URL);
  url.searchParams.set('token', token);
  if (callbackPath) {
    url.searchParams.set('callbackUrl', normalizeCallbackUrl(callbackPath));
  }
  return url.toString();
};

/* Optional: Invite code generator (DEV/Test) */
export const generateInviteCode = (
  segments = 3,
  segmentLen = 4,
  prefix = 'EIGA'
): string => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  const randSeg = () =>
    Array.from({ length: segmentLen }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const body = Array.from({ length: segments }, randSeg).join('-');
  return prefix ? `${prefix}-${body}` : body;
};
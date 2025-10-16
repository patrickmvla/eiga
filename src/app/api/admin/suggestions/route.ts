/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/suggestions/route.ts
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { suggestions } from "@/drizzle/schema";
import { auth } from "@/lib/auth/utils";
import { MemberSuggestionSchema } from "@/lib/validations/film.schema";
import { getCurrentMondayYmd } from "@/lib/utils/helpers";

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

// Next 15: redirects must be absolute
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
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect(abs(req, "/login?callbackUrl=/suggest"), 303);
  }

  const raw = await readPayload(req);

  // Honeypot: if bots fill hidden field, short‑circuit as success
  if (typeof raw?.website === "string" && raw.website.trim().length > 0) {
    return wantsJSON(req)
      ? toJSON({ ok: true, ignored: true }, 201)
      : NextResponse.redirect(abs(req, "/suggest?submitted=1"), 303);
  }

  const parsed = MemberSuggestionSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect(abs(req, "/suggest?error=invalid"), 303);
  }

  // Normalize/coerce
  const tmdbId = Number(parsed.data.tmdb_id);
  const title = parsed.data.title.trim();
  const pitch = parsed.data.pitch.trim();

  if (!Number.isFinite(tmdbId) || tmdbId <= 0 || title.length === 0) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid" }, 400)
      : NextResponse.redirect(abs(req, "/suggest?error=invalid"), 303);
  }

  const week = getCurrentMondayYmd();

  // Enforce one suggestion per week per user
  const exists = await db
    .select({ id: suggestions.id })
    .from(suggestions)
    .where(
      and(
        eq(suggestions.userId, session.user.id),
        eq(suggestions.weekSuggested, week)
      )
    )
    .limit(1);

  if (exists.length > 0) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "one_per_week" }, 409)
      : NextResponse.redirect(abs(req, "/suggest?error=rate_limit"), 303);
  }

  try {
    await db.insert(suggestions).values({
      userId: session.user.id,
      tmdbId,
      title,
      pitch,
      weekSuggested: week,
      status: "pending",
    });
  } catch {
    // DB failure (e.g., schema diff). Keep UX graceful.
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "server" }, 500)
      : NextResponse.redirect(abs(req, "/suggest?error=server"), 303);
  }

  return wantsJSON(req)
    ? toJSON({ ok: true }, 201)
    : NextResponse.redirect(abs(req, "/suggest?submitted=1"), 303);
}

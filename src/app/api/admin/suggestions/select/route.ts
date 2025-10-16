/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/suggestions/select/route.ts
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { films, suggestions } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";
import { getNextMondayYmd } from "@/lib/utils/helpers";
import { getMovieDetails, TMDB_ENABLED } from "@/lib/utils/tmdb";

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
  const admin = await ensureAdmin();
  if (!admin?.user) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect(abs(req, "/login?callbackUrl=/select-film"), 303);
  }

  const raw = await readPayload(req);
  const id = Number(raw?.suggestion_id);
  if (!Number.isFinite(id) || id <= 0) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "invalid_id" }, 400)
      : NextResponse.redirect(abs(req, "/manage?err=invalid_id"), 303);
  }

  // Fetch the suggestion and ensure it's still pending
  const s = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.id, id))
    .limit(1);

  const sug = s[0];
  if (!sug) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "not_found" }, 404)
      : NextResponse.redirect(abs(req, "/manage?err=not_found"), 303);
  }

  if (sug.status !== "pending") {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "not_pending" }, 409)
      : NextResponse.redirect(abs(req, "/manage?err=not_pending"), 303);
  }

  // Prepare next Monday and optional TMDB details
  const weekStart = getNextMondayYmd();
  let year = new Date().getFullYear();
  let posterUrl: string | null = null;
  let director: string | null = null;
  let runtime: number | null = null;

  if (TMDB_ENABLED) {
    try {
      const details = await getMovieDetails(sug.tmdbId, { language: "en-US" });
      year = details.year ?? year;
      posterUrl = details.posterUrl ?? null;
      director = details.directors?.[0] ?? null;
      runtime = typeof details.runtime === "number" ? details.runtime : null;
    } catch {
      // ignore TMDB errors; fallback to provided title/year
    }
  }

  // Atomically mark suggestion as selected and upsert the film for next Monday
  await db.transaction(async (tx) => {
    // Mark suggestion selected (only if still pending to avoid race)
    await tx
      .update(suggestions)
      .set({ status: "selected" })
      .where(and(eq(suggestions.id, id), eq(suggestions.status, "pending")));

    // Upsert film by unique week_start
    await tx
      .insert(films)
      .values({
        tmdbId: sug.tmdbId,
        title: sug.title,
        year,
        posterUrl,
        director,
        runtime: runtime ?? null,
        weekStart,
        suggestedBy: sug.userId,
        status: "upcoming",
      })
      .onConflictDoUpdate({
        target: [films.weekStart],
        set: {
          tmdbId: sug.tmdbId,
          title: sug.title,
          year,
          posterUrl,
          director,
          runtime: runtime ?? null,
          suggestedBy: sug.userId,
          status: "upcoming",
        },
      });
  });

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect(abs(req, "/select-film?loaded=1"), 303);
}
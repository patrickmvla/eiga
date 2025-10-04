/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/films/schedule/route.ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { films } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";
import { AdminScheduleFilmSchema } from "@/lib/validations/film.schema";

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

const abs = (req: Request, path: string) => new URL(path, req.url);

const readPayload = async (req: Request) => {
  try {
    const form = await req.formData();
    return Object.fromEntries(form.entries() as any);
  } catch {
    return (await req.json().catch(() => ({}))) as Record<string, any>;
  }
};

// Build a plain-text admin notes block from the wizard inputs
const buildAdminNotes = (data: any) => {
  const parts: string[] = [];
  if (data.why) parts.push(`Why this film:\n${data.why}`);
  if (Array.isArray(data.themes) && data.themes.length) {
    parts.push(
      `Themes:\n${data.themes.map((t: string) => `- ${t}`).join("\n")}`
    );
  }
  if (Array.isArray(data.technical) && data.technical.length) {
    parts.push(
      `Technical:\n${data.technical.map((t: string) => `- ${t}`).join("\n")}`
    );
  }
  if (data.context) parts.push(`Context:\n${data.context}`);
  return parts.join("\n\n");
};

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect(abs(req, "/login?callbackUrl=/select-film"), {
          status: 303,
        });
  }

  const raw = await readPayload(req);
  const parsed = AdminScheduleFilmSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect(abs(req, "/select-film?error=invalid"), {
          status: 303,
        });
  }

  const { tmdb_id, title, year, poster_url, week_start, status } = parsed.data;
  const adminNotes = buildAdminNotes(parsed.data);
  const effectiveYear = year ?? new Date().getFullYear();

  // Upsert by week_start (unique)
  const existing = await db
    .select({ id: films.id })
    .from(films)
    .where(eq(films.weekStart, week_start))
    .limit(1);

  let filmId: number;
  if (existing.length) {
    await db
      .update(films)
      .set({
        tmdbId: tmdb_id,
        title,
        year: effectiveYear,
        posterUrl: poster_url ?? null,
        adminNotes,
        status,
      })
      .where(eq(films.id, existing[0].id));
    filmId = existing[0].id;
  } else {
    const inserted = await db
      .insert(films)
      .values({
        tmdbId: tmdb_id,
        title,
        year: effectiveYear,
        posterUrl: poster_url ?? null,
        weekStart: week_start,
        adminNotes,
        status,
      })
      .returning({ id: films.id });
    filmId = inserted[0].id;
  }

  // If setting as current, archive any previous current film and set this one to current
  if (status === "current") {
    await db
      .update(films)
      .set({ status: "archived" })
      .where(eq(films.status, "current"));
    await db
      .update(films)
      .set({ status: "current" })
      .where(eq(films.id, filmId));
  }

  return wantsJSON(req)
    ? toJSON({ ok: true, id: filmId })
    : NextResponse.redirect(abs(req, "/manage?scheduled=1"), { status: 303 });
}

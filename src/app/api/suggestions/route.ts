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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return wantsJSON(req)
      ? toJSON({ ok: false, error: "unauthorized" }, 401)
      : NextResponse.redirect("/login?callbackUrl=/suggest", { status: 303 });
  }

  // Read payload (form or json)
  let raw: Record<string, any> = {};
  try {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries() as any);
  } catch {
    raw = (await req.json().catch(() => ({}))) as Record<string, any>;
  }

  const parsed = MemberSuggestionSchema.safeParse(raw);
  if (!parsed.success) {
    return wantsJSON(req)
      ? toJSON(
          { ok: false, error: "invalid", issues: parsed.error.flatten() },
          400
        )
      : NextResponse.redirect("/suggest?error=invalid", { status: 303 });
  }

  const { tmdb_id, title, pitch } = parsed.data;
  const week = getCurrentMondayYmd();

  // Enforce one suggestion per week
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
      : NextResponse.redirect("/suggest?error=rate_limit", { status: 303 });
  }

  await db.insert(suggestions).values({
    userId: session.user.id,
    tmdbId: tmdb_id,
    title,
    pitch,
    weekSuggested: week,
    status: "pending",
  });

  return wantsJSON(req)
    ? toJSON({ ok: true })
    : NextResponse.redirect("/suggest?submitted=1", { status: 303 });
}

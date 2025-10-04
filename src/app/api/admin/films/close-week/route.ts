// app/api/admin/films/close-week/route.ts
import { films } from "@/drizzle/schema";
import { ensureAdmin } from "@/lib/auth/utils";
import { db } from "@/lib/db/client";
import { getNextMondayYmd } from "@/lib/utils/helpers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin?.user) return toJSON({ ok: false, error: "unauthorized" }, 401);

  const form = await req.formData().catch(() => null);
  const weekStart = (form?.get("week_start") || "").toString();
  if (!weekStart) return toJSON({ ok: false, error: "invalid" }, 400);

  // Archive the given week (if it exists)
  await db
    .update(films)
    .set({ status: "archived" })
    .where(eq(films.weekStart, weekStart));

  // Promote next week's film (if present) from upcoming -> current
  const nextWeek = getNextMondayYmd();
  const next = await db
    .select({ id: films.id, status: films.status })
    .from(films)
    .where(eq(films.weekStart, nextWeek))
    .limit(1);

  if (next[0]) {
    await db
      .update(films)
      .set({ status: "current" })
      .where(eq(films.id, next[0].id));
  }

  return NextResponse.redirect("/manage?closed=1", { status: 303 });
}

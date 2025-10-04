/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { WaitlistRequestSchema } from "@/lib/validations/user.schema";
import { EMAIL } from "@/lib/auth/config";
import { sendWaitlistAdminEmail } from "@/lib/email/send";

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

const wantsJSON = (req: Request) => {
  const a = req.headers.get("accept") || "";
  const c = req.headers.get("content-type") || "";
  return a.includes("application/json") || c.includes("application/json");
};

export async function POST(req: Request) {
  // Read as formData first (from the page), else JSON
  let raw: Record<string, any> = {};
  try {
    const form = await req.formData();
    raw = Object.fromEntries(form.entries() as any);
  } catch {
    try {
      raw = (await req.json()) as Record<string, any>;
    } catch {
      // ignore
    }
  }

  // Validate
  const parsed = WaitlistRequestSchema.safeParse(raw);
  if (!parsed.success) {
    if (wantsJSON(req)) {
      return toJSON(
        { ok: false, error: "invalid", issues: parsed.error.flatten() },
        400
      );
    }
    // Prefill name/email on redirect for convenience
    const name =
      typeof raw?.name === "string" ? encodeURIComponent(raw.name) : "";
    const email =
      typeof raw?.email === "string" ? encodeURIComponent(raw.email) : "";

    // Infer a specific error code from Zod issues
    const flat = parsed.error.flatten();
    const fields = flat.fieldErrors || {};
    let code = "invalid";
    if (fields.email) code = "invalid_email";
    else if (fields.about) code = "about_too_short";
    else if (fields.conduct) code = "conduct_required";
    else if (fields.letterboxd) code = "letterboxd_url";

    if (process.env.NODE_ENV === "development") {
      // Helpful for local debugging
      console.warn("[waitlist] validation failed:", flat);
    }

    const dest = new URL(
      `/request-invite?error=${code}${name ? `&name=${name}` : ""}${
        email ? `&email=${email}` : ""
      }`,
      req.url
    );
    return NextResponse.redirect(dest, { status: 303 });
  }

  const {
    name,
    email,
    letterboxd,
    about,
    threeFilms,
    timezone,
    availability,
    hear,
  } = parsed.data;

  // Collect simple metadata
  const ua = req.headers.get("user-agent") || "";
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "") as string;

  // Best-effort insert; ignore if table not present yet
  try {
    await db.execute(sql`
      INSERT INTO "waitlist"
        ("name", "email", "letterboxd", "about", "three_films", "timezone", "availability", "hear", "user_agent", "ip", "created_at")
      VALUES
        (${name}, ${email}, ${letterboxd ?? null}, ${about}, ${
      threeFilms ?? null
    }, ${timezone ?? null}, ${availability}, ${hear ?? null}, ${ua}, ${
      ip || null
    }, NOW())
    `);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[waitlist] insert skipped (table missing?):",
        (e as Error).message
      );
    }
  }

  // Optional: notify admin via email (centralized helper; logs in dev if no RESEND_API_KEY)
  if (process.env.RESEND_API_KEY) {
    try {
      const to = process.env.ADMIN_EMAIL || EMAIL.replyTo || EMAIL.from;
      await sendWaitlistAdminEmail(to, {
        name,
        email,
        letterboxd,
        timezone,
        availability,
        about,
        threeFilms,
        ua,
        ip,
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[waitlist] admin email failed:", (e as Error).message);
      }
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[waitlist] received:", { name, email, availability });
    }
  }

  if (wantsJSON(req)) {
    return toJSON({ ok: true });
  }

  const dest = new URL("/request-invite?success=1", req.url);
  return NextResponse.redirect(dest, { status: 303 });
}

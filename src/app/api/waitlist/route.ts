/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/waitlist/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { WaitlistRequestSchema } from '@/lib/validations/user.schema';
import { EMAIL } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toJSON = (body: unknown, status = 200) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const wantsJSON = (req: Request) => {
  const a = req.headers.get('accept') || '';
  const c = req.headers.get('content-type') || '';
  return a.includes('application/json') || c.includes('application/json');
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
      return toJSON({ ok: false, error: 'invalid', issues: parsed.error.flatten() }, 400);
    }
    // Prefill name/email on redirect for convenience
    const name = typeof raw?.name === 'string' ? encodeURIComponent(raw.name) : '';
    const email = typeof raw?.email === 'string' ? encodeURIComponent(raw.email) : '';
    return NextResponse.redirect(
      `/request-invite?error=invalid${name ? `&name=${name}` : ''}${email ? `&email=${email}` : ''}`,
      { status: 303 }
    );
  }

  const { name, email, letterboxd, about, threeFilms, timezone, availability, hear } = parsed.data;

  // Collect simple metadata
  const ua = req.headers.get('user-agent') || '';
  const ip =
    (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '') as string;

  // Best-effort insert; ignore if table not present yet
  try {
    await db.execute(sql`
      INSERT INTO "waitlist"
        ("name", "email", "letterboxd", "about", "three_films", "timezone", "availability", "hear", "user_agent", "ip", "created_at")
      VALUES
        (${name}, ${email}, ${letterboxd ?? null}, ${about}, ${threeFilms ?? null}, ${timezone ?? null}, ${availability}, ${hear ?? null}, ${ua}, ${ip || null}, NOW())
    `);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[waitlist] insert skipped (table missing?):', (e as Error).message);
    }
  }

  // Optional: notify admin via email (Resend)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const safeLetterboxd = letterboxd ? `\nLetterboxd: ${letterboxd}` : '';
      const safeThree = threeFilms ? `\nThree films: ${threeFilms}` : '';
      const safeHear = hear ? `\nHeard via: ${hear}` : '';
      const text = `New waitlist request:

Name: ${name}
Email: ${email}${safeLetterboxd}
Timezone: ${timezone ?? ''}
Availability: ${availability}${safeHear}
About:
${about}
${safeThree}

UA: ${ua}
IP: ${ip || ''}`;

      await resend.emails.send({
        from: EMAIL.from,
        to: [process.env.ADMIN_EMAIL || EMAIL.replyTo || EMAIL.from],
        subject: `Eiga waitlist: ${name}`,
        text,
      });
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[waitlist] admin email failed:', (e as Error).message);
      }
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('[waitlist] received:', { name, email, availability });
    }
  }

  if (wantsJSON(req)) {
    return toJSON({ ok: true });
  }

  return NextResponse.redirect('/request-invite?success=1', { status: 303 });
}
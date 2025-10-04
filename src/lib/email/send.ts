/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/email/send.ts
import {
  EMAIL,
  magicLinkHtml,
  magicLinkSubject,
  magicLinkText,
  inviteHtml,
  inviteSubject,
  inviteText,
} from "@/lib/auth/config";

type SendArgs = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

type SendResult = { ok: boolean; id?: string; error?: string };

const hasResend = () => Boolean(process.env.RESEND_API_KEY);

// Resolve a safe "from" address (fallback to Resend onboarding in dev)
const resolveFrom = () => {
  if (EMAIL.from && EMAIL.from.trim().length > 0) return EMAIL.from;
  // Dev-friendly default if no domain configured
  return "Eiga <onboarding@resend.dev>";
};

// Normalize recipient(s)
const normalizeTo = (to: string | string[]) =>
  (Array.isArray(to) ? to : [to]).filter(Boolean);

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendArgs): Promise<SendResult> => {
  const toArr = normalizeTo(to);

  // At least one body format (text or html)
  const textBody = typeof text === "string" ? text : undefined;
  const htmlBody = typeof html === "string" ? html : undefined;

  if (!hasResend()) {
    // Dev fallback: log the email so you can click links locally
    if (process.env.NODE_ENV === "development") {
      console.log("[email:dev]", {
        from: resolveFrom(),
        to: toArr,
        subject,
        text: textBody?.slice(0, 400),
        html: htmlBody ? "[html]" : undefined,
      });
    }
    return { ok: false };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build payload; cast to any to avoid SDK type issues (react/email-render union)
    const payload: any = {
      from: resolveFrom(),
      to: toArr,
      subject,
    };
    if (EMAIL.replyTo) payload.replyTo = EMAIL.replyTo;
    if (htmlBody) payload.html = htmlBody;
    if (textBody) payload.text = textBody;
    if (!payload.html && !payload.text) payload.text = ""; // minimal fallback

    const res = await resend.emails.send(payload as any);
    return { ok: true, id: (res as any)?.id };
  } catch (e: any) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email:send] failed:", e?.message || e);
    }
    return { ok: false, error: e?.message || String(e) };
  }
};

// Specific helpers

export const sendMagicLinkEmail = async (
  to: string,
  link: string
): Promise<SendResult> => {
  return sendEmail({
    to,
    subject: magicLinkSubject(),
    text: magicLinkText(link),
    html: magicLinkHtml(link),
  });
};

export const sendInviteEmail = async (
  to: string,
  redeemUrl: string,
  expiresInDays = 14
): Promise<SendResult> => {
  return sendEmail({
    to,
    subject: inviteSubject(),
    text: inviteText(redeemUrl, expiresInDays),
    html: inviteHtml(redeemUrl, expiresInDays),
  });
};

export const sendWaitlistAdminEmail = async (
  to: string,
  payload: {
    name: string;
    email: string;
    letterboxd?: string | null;
    timezone?: string | null;
    availability: string;
    about: string;
    threeFilms?: string | null;
    ua?: string;
    ip?: string;
  }
): Promise<SendResult> => {
  const safeLetterboxd = payload.letterboxd
    ? `\nLetterboxd: ${payload.letterboxd}`
    : "";
  const safeThree = payload.threeFilms
    ? `\nThree films: ${payload.threeFilms}`
    : "";
  const text = `New waitlist request:

Name: ${payload.name}
Email: ${payload.email}${safeLetterboxd}
Timezone: ${payload.timezone ?? ""}
Availability: ${payload.availability}
About:
${payload.about}
${safeThree}

UA: ${payload.ua ?? ""}
IP: ${payload.ip ?? ""}`;

  // Text-only is fine for admin notifications
  return sendEmail({
    to,
    subject: `Eiga waitlist: ${payload.name}`,
    text,
  });
};

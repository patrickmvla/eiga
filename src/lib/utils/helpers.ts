// lib/utils/helpers.ts

/* Environment */
export const isDev = process.env.NODE_ENV === "development";

/* ------------------------------- Date helpers ------------------------------ */

/** Format a Date to YYYY-MM-DD (local time). */
export const toYMD = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/** Parse a YYYY-MM-DD string into a Date (local time at 00:00). */
export const fromYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/** Get Monday 00:00 of the week for a given date (local time). */
export const getMonday = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon...
  const diffToMon = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diffToMon);
  return d;
};

/** Get current Monday as YYYY-MM-DD (local). */
export const getCurrentMondayYmd = (): string => toYMD(getMonday());

/** Get next Monday as YYYY-MM-DD (local). */
export const getNextMondayYmd = (): string => {
  const mon = getMonday();
  mon.setDate(mon.getDate() + 7);
  return toYMD(mon);
};

/** Format a week window (Mon–Sun) like `Jan 01 – Jan 07`. */
export const formatWeekWindow = (
  weekStart: string | Date,
  locale?: string
): string => {
  const start =
    typeof weekStart === "string" ? fromYMD(weekStart) : new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { month: "short", day: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
};

/** Format a date with sensible defaults. */
export const formatDate = (
  input: string | Date,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  },
  locale?: string
): string => {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(locale, opts);
};

/* ---------------------------- Weekly phase helpers ------------------------- */

export type WeeklyPhase = "watch" | "discussion" | "ended";

export type WeeklyPhaseInfo = {
  phase: WeeklyPhase;
  label: string; // UI label for the countdown (e.g., "Discussion opens in")
  nextAt: Date; // Next boundary (Fri 00:00 or next Mon 00:00 or following Mon)
  msRemaining: number; // Milliseconds remaining until nextAt
  humanRemaining: string; // e.g., "2d 4h 12m"
};

/**
 * Compute weekly phase from weekStart (Monday 00:00 local).
 * - Mon–Thu: watch
 * - Fri–Sun: discussion
 * - After Sun: ended (until next drop)
 */
export const computeWeeklyPhase = (
  weekStart: string | Date,
  now: Date = new Date()
): WeeklyPhaseInfo => {
  const start =
    typeof weekStart === "string" ? fromYMD(weekStart) : new Date(weekStart);
  const fri = new Date(start);
  fri.setDate(start.getDate() + 4); // Fri 00:00
  const nextMon = new Date(start);
  nextMon.setDate(start.getDate() + 7); // next Mon 00:00

  let phase: WeeklyPhase;
  let label: string;
  let nextAt: Date;

  if (now < fri) {
    phase = "watch";
    label = "Discussion opens in";
    nextAt = fri;
  } else if (now < nextMon) {
    phase = "discussion";
    label = "Week ends in";
    nextAt = nextMon;
  } else {
    phase = "ended";
    label = "Next film drops in";
    nextAt = new Date(nextMon);
    nextAt.setDate(nextMon.getDate() + 7);
  }

  const msRemaining = Math.max(0, nextAt.getTime() - now.getTime());
  return {
    phase,
    label,
    nextAt,
    msRemaining,
    humanRemaining: formatMs(msRemaining),
  };
};

/** Format milliseconds as a compact "Xd Yh Zm" string. */
export const formatMs = (ms: number): string => {
  if (ms <= 0) return "0m";
  const totalMins = Math.floor(ms / 60000);
  const d = Math.floor(totalMins / (60 * 24));
  const h = Math.floor((totalMins % (60 * 24)) / 60);
  const m = totalMins % 60;
  return [d ? `${d}d` : null, h ? `${h}h` : null, `${m}m`]
    .filter(Boolean)
    .join(" ");
};

/* ------------------------------ Timecode utils ----------------------------- */

/** Convert seconds to "mm:ss" or "h:mm:ss". */
export const secondsToTimecode = (s?: number | null): string | null => {
  if (s == null || !Number.isFinite(s) || s < 0) return null;
  const secs = Math.floor(s);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sec = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

/**
 * Parse timecode:
 * - number seconds
 * - "mm:ss" or "h:mm:ss"
 * - numeric string seconds
 * Returns integer seconds or undefined if invalid/empty.
 */
export const timecodeToSeconds = (val: unknown): number | undefined => {
  if (val == null) return undefined;
  if (typeof val === "number" && Number.isFinite(val) && val >= 0) {
    return Math.floor(val);
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (s.length === 0) return undefined;
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    }
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(":").map(Number);
      if (parts.some((n) => !Number.isFinite(n) || n < 0)) return undefined;
      if (parts.length === 2) {
        const [mm, ss] = parts;
        if (ss >= 60) return undefined;
        return mm * 60 + ss;
      } else {
        const [hh, mm, ss] = parts;
        if (mm >= 60 || ss >= 60) return undefined;
        return hh * 3600 + mm * 60 + ss;
      }
    }
  }
  return undefined;
};

/* ------------------------------ Number helpers ----------------------------- */

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/** Round to 1 decimal (e.g., scores). */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Safe numeric parse with default. */
export const toNumber = (v: unknown, def = 0): number => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : def;
};

/* ------------------------------ String helpers ----------------------------- */

/** Shorten a string to maxLen with an ellipsis. */
export const excerpt = (s: string, maxLen = 160): string =>
  s.length <= maxLen ? s : `${s.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;

/** Simple pluralization helper. */
export const pluralize = (
  n: number,
  singular: string,
  plural?: string
): string => `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`;

/** Type guard to filter out null/undefined. */
export const notEmpty = <T>(v: T | null | undefined): v is T => v != null;

/* --------------------------- Query string helpers -------------------------- */

/**
 * Build a query string from key/value pairs.
 * - Skips undefined/null.
 * - For arrays, repeats keys (?k=a&k=b) unless arrayStyle: 'comma'.
 */
export const buildQuery = (
  params: Record<string, unknown>,
  opts?: {
    leading?: boolean;
    arrayStyle?: "repeat" | "comma";
    skipEmptyString?: boolean;
  }
): string => {
  const leading = opts?.leading ?? true;
  const arrayStyle = opts?.arrayStyle ?? "repeat";
  const skipEmpty = opts?.skipEmptyString ?? false;

  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (typeof v === "string") {
      if (skipEmpty && v.length === 0) return;
      sp.append(k, v);
      return;
    }
    if (Array.isArray(v)) {
      if (arrayStyle === "comma") {
        const joined = v
          .filter((x) => x != null && String(x).length > 0)
          .join(",");
        if (joined.length > 0) sp.set(k, joined);
      } else {
        v.forEach((item) => {
          if (item != null) sp.append(k, String(item));
        });
      }
      return;
    }
    sp.append(k, String(v));
  });

  const q = sp.toString();
  return q ? (leading ? `?${q}` : q) : "";
};

/* ------------------------------- Error utils ------------------------------- */

export const errorMessage = (
  e: unknown,
  fallback = "Something went wrong"
): string => {
  if (!e) return fallback;
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || fallback;
  try {
    return JSON.stringify(e);
  } catch {
    return fallback;
  }
};

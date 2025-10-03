// lib/validations/film.schema.ts
import { z } from 'zod';

/* Helpers */
const trimCompact = (s: string) => s.replace(/\s+/g, ' ').trim();
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const isOneDecimal = (n: number) => Math.round(n * 10) === n * 10;

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const REVIEW_MIN_WORDS = 100;
export const REVIEW_MAX_WORDS = 1000;

/* Shared primitives */
export const FilmIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ScoreSchema = z.coerce
  .number()
  .min(SCORE_MIN, `Score must be at least ${SCORE_MIN}`)
  .max(SCORE_MAX, `Score must be at most ${SCORE_MAX}`)
  .refine(isOneDecimal, 'Score must be in increments of 0.1');

/* Review text with word-count enforcement (100–1000 words) */
export const ReviewTextSchema = z
  .string()
  .transform((s) => trimCompact(s))
  .refine(
    (s) => {
      const wc = wordCount(s);
      return wc >= REVIEW_MIN_WORDS && wc <= REVIEW_MAX_WORDS;
    },
    { message: `Review must be ${REVIEW_MIN_WORDS}–${REVIEW_MAX_WORDS} words.` }
  )
  .max(8000, 'Review is too long'); // character guard for safety

/* Watch status */
export const WatchStatusSchema = z.enum([
  'not_watched',
  'watching',
  'watched',
  'rewatched',
]);

/* Admin: “The Setup” line-list (textarea lines → string[]) */
const lineList = z
  .union([z.string(), z.array(z.string())])
  .transform((val) => {
    const arr = typeof val === 'string' ? val.split(/\r?\n/) : val;
    return arr.map((s) => s.trim()).filter((s) => s.length > 0);
  });

/* YYYY-MM-DD guard (optionally Monday) */
const DateYmdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const MondayYmdSchema = DateYmdSchema.refine((ymd) => {
  const [yy, mm, dd] = ymd.split('-').map(Number);
  const d = new Date(Date.UTC(yy, mm - 1, dd));
  // 1 = Monday (UTC)
  return d.getUTCDay() === 1;
}, 'week_start should be a Monday');

/* Admin: schedule/select film + setup */
export const AdminScheduleFilmSchema = z.object({
  tmdb_id: z.coerce.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(300).transform(trimCompact),
  year: z.coerce.number().int().min(1888).max(2100).optional(),
  poster_url: z.string().url().max(500).optional(),

  // “The Setup”
  why: z
    .string()
    .transform((s) => trimCompact(s))
    .pipe(z.string().min(10, 'Add a short rationale (≥10 chars)').max(1000))
    .optional(),
  themes: lineList
    .transform((arr) => arr.slice(0, 10))
    .refine((arr) => arr.length >= 1, { message: 'Add at least one theme.' })
    .refine((arr) => arr.every((s) => s.length <= 120), {
      message: 'Themes should be ≤120 characters each.',
    }),
  technical: lineList
    .transform((arr) => arr.slice(0, 10))
    .refine((arr) => arr.every((s) => s.length <= 120), {
      message: 'Technical notes should be ≤120 characters each.',
    })
    .optional()
    .default([]),
  context: z
    .string()
    .transform((s) => trimCompact(s))
    .max(280, 'Context should be brief (≤280 chars)')
    .optional(),

  // Schedule
  week_start: MondayYmdSchema, // enforce Monday (00:00 drop)
  status: z.enum(['upcoming', 'current']).default('upcoming'),
});
export type AdminScheduleFilmInput = z.infer<typeof AdminScheduleFilmSchema>;

/* Member: suggest a film (one per week) */
export const MemberSuggestionSchema = z.object({
  tmdb_id: z.coerce.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(300).transform(trimCompact),
  pitch: z
    .string()
    .transform((s) => trimCompact(s))
    .min(10, 'Pitch must be at least 10 characters')
    .max(500, 'Pitch must be at most 500 characters'),
  year: z.coerce.number().int().min(1888).max(2100).optional(),
  poster_url: z.string().url().max(500).optional(),
});
export type MemberSuggestionInput = z.infer<typeof MemberSuggestionSchema>;

/* Ratings: create (requires both score and review) */
export const RatingCreateSchema = z.object({
  film_id: z.coerce.number().int().positive(),
  score: ScoreSchema,
  review: ReviewTextSchema,
});
export type RatingCreateInput = z.infer<typeof RatingCreateSchema>;

/* Ratings: edit (allow updating either; if review present, enforce word count) */
export const RatingEditSchema = z
  .object({
    film_id: z.coerce.number().int().positive(),
    score: ScoreSchema.optional(),
    review: z
      .string()
      .optional()
      .transform((s) => (typeof s === 'string' ? trimCompact(s) : s)),
  })
  .superRefine((val, ctx) => {
    if (val.score == null && (!val.review || val.review.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['score'],
        message: 'Provide a score and/or a review.',
      });
    }
    if (val.review && val.review.length > 0) {
      const wc = wordCount(val.review);
      if (wc < REVIEW_MIN_WORDS || wc > REVIEW_MAX_WORDS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['review'],
          message: `Review must be ${REVIEW_MIN_WORDS}–${REVIEW_MAX_WORDS} words.`,
        });
      }
    }
  });
export type RatingEditInput = z.infer<typeof RatingEditSchema>;

/* Watch status update */
export const WatchStatusUpdateSchema = z.object({
  film_id: z.coerce.number().int().positive(),
  status: z.enum(['not_watched', 'watching', 'watched', 'rewatched']),
});
export type WatchStatusUpdateInput = z.infer<typeof WatchStatusUpdateSchema>;
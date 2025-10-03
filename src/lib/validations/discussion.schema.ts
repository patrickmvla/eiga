// lib/validations/discussion.schema.ts
import { z } from 'zod';

/* Utils */
const trimCompact = (s: string) => s.replace(/\s+/g, ' ').trim();

const Booleanish = z.preprocess((v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(s)) return true;
    if (['false', '0', 'off', 'no'].includes(s)) return false;
  }
  return false;
}, z.boolean());

/* Parse timestamps:
   - Accepts seconds (number or numeric string)
   - Accepts mm:ss or hh:mm:ss
   - Returns integer seconds, or undefined when blank/invalid (optional field)
*/
const parseTimecode = (val: unknown): number | undefined => {
  if (val == null) return undefined;
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return Math.floor(val);
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.length === 0) return undefined;
    // Numeric string
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    }
    // hh:mm:ss or mm:ss
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':').map((x) => Number(x));
      if (parts.some((n) => !Number.isFinite(n) || n < 0)) return undefined;
      let secs = 0;
      if (parts.length === 2) {
        const [mm, ss] = parts;
        if (ss >= 60) return undefined;
        secs = mm * 60 + ss;
      } else if (parts.length === 3) {
        const [hh, mm, ss] = parts;
        if (mm >= 60 || ss >= 60) return undefined;
        secs = hh * 3600 + mm * 60 + ss;
      }
      return Math.floor(secs);
    }
  }
  return undefined;
};

export const TimestampSchema = z
  .preprocess(parseTimecode, z.number().int().min(0).max(60 * 60 * 12).optional()); // cap at 12h just to be safe

/* Content constraints for discussion messages */
export const DiscussionContentSchema = z
  .string()
  .transform((s) => trimCompact(s))
  .min(5, 'Say a bit more (≥ 5 characters).')
  .max(5000, 'Keep it under 5000 characters.');

/* Create a new comment (thread-starter or reply)
   - parent_id omitted => top-level thread comment
   - parent_id present => reply to that comment
   - parent_depth (optional hint): 0 for replying to root; 1 means replying to a reply (disallowed)
     Note: Server must still verify actual depth from DB.
*/
export const DiscussionCreateSchema = z
  .object({
    film_id: z.coerce.number().int().positive(),
    parent_id: z.coerce.number().int().positive().optional(),
    parent_depth: z.coerce.number().int().min(0).max(1).optional(),
    content: DiscussionContentSchema,
    has_spoilers: Booleanish.optional().default(false),
    timestamp_reference: TimestampSchema, // seconds, optional
  })
  .superRefine((val, ctx) => {
    // Enforce two-level threads with a hint; server must verify actual depth
    if (val.parent_id && typeof val.parent_depth === 'number' && val.parent_depth >= 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parent_id'],
        message: 'Replies are limited to two levels.',
      });
    }
  });
export type DiscussionCreateInput = z.infer<typeof DiscussionCreateSchema>;

/* Edit an existing comment */
export const DiscussionEditSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    content: z
      .string()
      .optional()
      .transform((s) => (typeof s === 'string' ? trimCompact(s) : s)),
    has_spoilers: Booleanish.optional(),
    timestamp_reference: TimestampSchema,
  })
  .superRefine((val, ctx) => {
    // Must update at least one field
    const hasAny =
      (val.content && val.content.length > 0) ||
      typeof val.has_spoilers === 'boolean' ||
      typeof val.timestamp_reference === 'number';
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Nothing to update.',
      });
    }
    if (typeof val.content === 'string') {
      const tmp = DiscussionContentSchema.safeParse(val.content);
      if (!tmp.success) {
        tmp.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }
  });
export type DiscussionEditInput = z.infer<typeof DiscussionEditSchema>;

/* Delete a comment (server must verify author/admin) */
export const DiscussionDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type DiscussionDeleteInput = z.infer<typeof DiscussionDeleteSchema>;

/* Reactions */
export const ReactionTypeSchema = z.enum(['insightful', 'controversial', 'brilliant']);

export const ReactionAddSchema = z.object({
  discussion_id: z.coerce.number().int().positive(),
  type: ReactionTypeSchema,
});
export type ReactionAddInput = z.infer<typeof ReactionAddSchema>;

export const ReactionRemoveSchema = z.object({
  discussion_id: z.coerce.number().int().positive(),
});
export type ReactionRemoveInput = z.infer<typeof ReactionRemoveSchema>;

/* Admin: highlight toggle for public excerpts */
export const AdminHighlightDiscussionSchema = z.object({
  item_id: z.coerce.number().int().positive(),
  // 'review' or 'comment' if you later reuse this for reviews; for now fix to 'comment'
  type: z.literal('comment').default('comment'),
  highlight: Booleanish.optional().default(true),
});
export type AdminHighlightDiscussionInput = z.infer<typeof AdminHighlightDiscussionSchema>;
import { z } from "zod";

/* Utils */
const trim = (s: string) => s.trim();
const trimCompact = (s: string) => s.replace(/\s+/g, " ").trim();

const Booleanish = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (["true", "1", "on", "yes"].includes(s)) return true;
    if (["false", "0", "off", "no"].includes(s)) return false;
  }
  return false;
}, z.boolean());

// FIXED: Changed z.string().url() to z.url()
const OptionalURL = z
  .url()
  .max(1000)
  .or(z.literal("").transform(() => undefined))
  .optional();

const NonEmptyTrimmed = z
  .string()
  .transform(trim)
  .refine((s) => s.length > 0, "Required");

const UsernameRegex = /^[A-Za-z0-9_]{3,20}$/;
const InviteCodeRegex = /^[A-Z0-9-]{8,64}$/;

const RelativeOrHttpUrl = z
  .string()
  .transform(trim)
  .refine(
    (s) => s.length === 0 || s.startsWith("/") || /^https?:\/\//i.test(s),
    "Must be a relative path or http(s) URL"
  );

/* Shared primitives */
export const EmailSchema = z
  .email("Enter a valid email address")
  .transform(trim);
export const UsernameSchema = z
  .string()
  .regex(UsernameRegex, "3–20 chars, letters/numbers/underscore only")
  .transform(trim);
export const NameSchema = z
  .string()
  .min(1, "Name is required")
  .max(80, "Keep it under 80 characters")
  .transform(trimCompact);

export const UUIDSchema = z.uuid("Invalid ID");
export const InviteCodeSchema = z
  .string()
  .regex(InviteCodeRegex, "Invalid invite code")
  .transform((s) => s.toUpperCase().trim());

/* Honeypot field (must be empty) */
export const HoneypotSchema = z
  .object({
    website: z.string().optional().default(""),
  })
  .refine((v) => !v.website || v.website.length === 0, {
    error: "Bot detected",
  });

/* -------------------------------------------------------------------------- */
/* Auth: Magic link login                                                     */
/* -------------------------------------------------------------------------- */

export const MagicLinkRequestSchema = z
  .object({
    email: EmailSchema,
    callbackUrl: RelativeOrHttpUrl.optional(),
  })
  .extend(HoneypotSchema.shape);
export type MagicLinkRequestInput = z.infer<typeof MagicLinkRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Auth: Redeem invite                                                        */
/* -------------------------------------------------------------------------- */

export const RedeemInviteSchema = z
  .object({
    code: InviteCodeSchema,
    email: EmailSchema,
    username: UsernameSchema,
    name: z
      .string()
      .max(80)
      .transform((s) => (s ? trimCompact(s) : undefined))
      .optional(),
    conduct: Booleanish.refine((v) => v === true, {
      error: "You must agree to the code of conduct.",
    }),
  })
  .extend(HoneypotSchema.shape);
export type RedeemInviteInput = z.infer<typeof RedeemInviteSchema>;

/* -------------------------------------------------------------------------- */
/* Waitlist (public request-invite)                                           */
/* -------------------------------------------------------------------------- */

export const WaitlistRequestSchema = z
  .object({
    name: NonEmptyTrimmed,
    email: EmailSchema,
    letterboxd: OptionalURL,
    about: z
      .string()
      .min(50, "Please write at least 50 characters")
      .max(2000, "Keep it under 2000 characters")
      .transform(trimCompact),
    threeFilms: z
      .string()
      .max(500)
      .transform(trimCompact)
      .or(z.literal("").transform(() => undefined))
      .optional(),
    timezone: z
      .string()
      .max(50)
      .transform(trim)
      .or(z.literal("").transform(() => undefined))
      .optional(),
    availability: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
    hear: z
      .string()
      .max(120)
      .transform(trimCompact)
      .or(z.literal("").transform(() => undefined))
      .optional(),
    conduct: Booleanish.refine((v) => v === true, {
      error: "You must agree to the code of conduct.",
    }),
  })
  .extend(HoneypotSchema.shape);
export type WaitlistRequestInput = z.infer<typeof WaitlistRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Profile + Preferences                                                      */
/* -------------------------------------------------------------------------- */

export const ProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  name: z
    .string()
    .max(80, "Keep it under 80 characters")
    .transform((s) => (s ? trimCompact(s) : undefined))
    .optional(),
  avatar_url: OptionalURL,
  bio: z
    .string()
    .max(280, "Bio should be ≤ 280 chars")
    .transform((s) => (s ? trimCompact(s) : undefined))
    .optional(),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const PreferencesSchema = z.object({
  textSize: z.enum(["sm", "md", "lg"]).default("md").optional(),
  density: z.enum(["comfortable", "compact"]).default("comfortable").optional(),
  reduceMotion: Booleanish.optional(),
  spoilerDefaultVisible: Booleanish.optional(),
  email: z
    .object({
      newFilm: Booleanish.optional(),
      replies: Booleanish.optional(),
      weeklySummary: Booleanish.optional(),
    })
    .partial()
    .optional(),
});
export type PreferencesInput = z.infer<typeof PreferencesSchema>;

/* -------------------------------------------------------------------------- */
/* Admin: Invites & Waitlist                                                  */
/* -------------------------------------------------------------------------- */

export const AdminSendInviteSchema = z
  .object({
    to_email: EmailSchema,
    expires_in_days: z.coerce.number().int().min(1).max(90).default(14),
  })
  .extend(HoneypotSchema.shape);
export type AdminSendInviteInput = z.infer<typeof AdminSendInviteSchema>;

export const AdminCreateInvitesSchema = z
  .object({
    quantity: z.coerce.number().int().min(1).max(20),
    expires_in_days: z.coerce.number().int().min(1).max(90).default(14),
    note: z
      .string()
      .max(140)
      .transform(trimCompact)
      .or(z.literal("").transform(() => undefined))
      .optional(),
  })
  .extend(HoneypotSchema.shape);
export type AdminCreateInvitesInput = z.infer<typeof AdminCreateInvitesSchema>;

export const AdminInviteRevokeSchema = z.object({
  code: InviteCodeSchema,
});
export type AdminInviteRevokeInput = z.infer<typeof AdminInviteRevokeSchema>;

export const AdminInviteExtendSchema = z.object({
  code: InviteCodeSchema,
  extend_days: z.coerce.number().int().min(1).max(90),
});
export type AdminInviteExtendInput = z.infer<typeof AdminInviteExtendSchema>;

export const AdminInviteDeleteSchema = z.object({
  code: InviteCodeSchema,
});
export type AdminInviteDeleteInput = z.infer<typeof AdminInviteDeleteSchema>;

export const AdminWaitlistApproveSchema = z.object({
  id: z.coerce.number().int().positive(),
  expires_in_days: z.coerce.number().int().min(1).max(90).default(14),
});
export type AdminWaitlistApproveInput = z.infer<
  typeof AdminWaitlistApproveSchema
>;

export const AdminWaitlistRejectSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type AdminWaitlistRejectInput = z.infer<
  typeof AdminWaitlistRejectSchema
>;

export const AdminWaitlistArchiveSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type AdminWaitlistArchiveInput = z.infer<
  typeof AdminWaitlistArchiveSchema
>;

/* Admin: Members */
export const AdminMemberToggleActiveSchema = z.object({
  user_id: UUIDSchema,
  set_active: z
    .union([
      z.literal("0"),
      z.literal("1"),
      z.coerce.number().int().min(0).max(1),
      Booleanish,
    ])
    .transform((v) => {
      if (typeof v === "string") return v === "1";
      if (typeof v === "number") return v === 1;
      return !!v;
    }),
});
export type AdminMemberToggleActiveInput = z.infer<
  typeof AdminMemberToggleActiveSchema
>;

export const AdminMemberRemoveSchema = z.object({
  user_id: UUIDSchema,
});
export type AdminMemberRemoveInput = z.infer<typeof AdminMemberRemoveSchema>;

/* Admin: Settings (landing teasers, seats available) */
export const AdminSettingsUpdateSchema = z.object({
  key: z.enum(["publicTeasersEnabled", "seatsAvailable"]),
  value: z.string().transform(trim),
});
export type AdminSettingsUpdateInput = z.infer<
  typeof AdminSettingsUpdateSchema
>;

/* Helper to coerce settings values safely */
export const parseAdminSettingValue = (input: AdminSettingsUpdateInput) => {
  if (input.key === "publicTeasersEnabled") {
    const val = input.value.toLowerCase();
    return ["1", "true", "on", "yes"].includes(val);
  }
  if (input.key === "seatsAvailable") {
    const n = Number(input.value);
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      throw new Error("seatsAvailable must be between 0 and 10");
    }
    return Math.floor(n);
  }
  return input.value;
};
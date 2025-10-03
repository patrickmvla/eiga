// drizzle/schema.ts
import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  serial,
  boolean,
  timestamp,
  date,
  numeric,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const filmStatusEnum = pgEnum("film_status", [
  "upcoming",
  "current",
  "archived",
]);
export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "selected",
  "rejected",
  "expired",
]);
export const reactionTypeEnum = pgEnum("reaction_type", [
  "insightful",
  "controversial",
  "brilliant",
]);
export const watchStatusEnum = pgEnum("watch_status", [
  "not_watched",
  "watching",
  "watched",
  "rewatched",
]);

// Users
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    username: text("username").notNull(),
    role: userRoleEnum("role").notNull(),
    avatarUrl: text("avatar_url"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    inviteCode: text("invite_code"),
    isActive: boolean("is_active").default(true),

    // Optional: add name later if needed
    // name: text('name'),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
    usernameUnique: uniqueIndex("users_username_unique").on(t.username),
    inviteCodeIdx: index("users_invite_code_idx").on(t.inviteCode),
  })
);

// Invites
export const invites = pgTable(
  "invites",
  {
    code: text("code").primaryKey(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    usedBy: uuid("used_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    expiresIdx: index("invites_expires_idx").on(t.expiresAt),
    createdByIdx: index("invites_created_by_idx").on(t.createdBy),
    usedByIdx: index("invites_used_by_idx").on(t.usedBy),
  })
);

// Foreign ref from users.invite_code -> invites.code
// Drizzle doesn't allow forward ref inline above, so add it here with SQL if needed in a migration.
// For most apps, it's fine to leave as loose link or wire in a migration:
// ALTER TABLE users ADD CONSTRAINT users_invite_code_fkey FOREIGN KEY (invite_code) REFERENCES invites(code);

// Films
export const films = pgTable(
  "films",
  {
    id: serial("id").primaryKey(),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    year: integer("year").notNull(),
    posterUrl: text("poster_url"),
    director: text("director"),
    runtime: integer("runtime"),
    weekStart: date("week_start").notNull(),
    adminNotes: text("admin_notes"),
    suggestedBy: uuid("suggested_by").references(() => users.id, {
      onDelete: "set null",
    }),
    status: filmStatusEnum("status").default("upcoming").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    weekStartUnique: uniqueIndex("films_week_start_unique").on(t.weekStart),
    statusIdx: index("films_status_idx").on(t.status),
    tmdbIdx: index("films_tmdb_idx").on(t.tmdbId),
    suggestedByIdx: index("films_suggested_by_idx").on(t.suggestedBy),
  })
);

// Ratings
export const ratings = pgTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    filmId: integer("film_id")
      .references(() => films.id, { onDelete: "cascade" })
      .notNull(),
    score: numeric("score", { precision: 3, scale: 1 })
      .$type<number>()
      .notNull(),
    review: text("review"),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueUserFilm: uniqueIndex("ratings_user_film_unique").on(
      t.userId,
      t.filmId
    ),
    userIdx: index("ratings_user_idx").on(t.userId),
    filmIdx: index("ratings_film_idx").on(t.filmId),
    scoreRangeCheck: sql`CHECK (${t.score} >= 1 AND ${t.score} <= 10)`,
  })
);

// Discussions (threads/comments)
export const discussions = pgTable(
  "discussions",
  {
    id: serial("id").primaryKey(),
    filmId: integer("film_id")
      .references(() => films.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // Remove the inline self-reference to break the TS cycle
    parentId: integer("parent_id"), // self-FK added via migration (see below)
    content: text("content").notNull(),
    isHighlighted: boolean("is_highlighted").default(false).notNull(),
    hasSpoilers: boolean("has_spoilers").default(false).notNull(),
    timestampReference: integer("timestamp_reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
  },
  (t) => ({
    filmIdx: index("discussions_film_idx").on(t.filmId),
    parentIdx: index("discussions_parent_idx").on(t.parentId),
    userIdx: index("discussions_user_idx").on(t.userId),
  })
);

// Suggestions
export const suggestions = pgTable(
  "suggestions",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    pitch: text("pitch").notNull(),
    weekSuggested: date("week_suggested").notNull(),
    status: suggestionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index("suggestions_user_idx").on(t.userId),
    statusIdx: index("suggestions_status_idx").on(t.status),
    weekIdx: index("suggestions_week_idx").on(t.weekSuggested),
    pitchLenCheck: sql`CHECK (char_length(${t.pitch}) BETWEEN 10 AND 500)`,
  })
);

// Reactions (to discussion comments)
export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    discussionId: integer("discussion_id")
      .references(() => discussions.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniqueUserDiscussion: uniqueIndex("reactions_user_discussion_unique").on(
      t.userId,
      t.discussionId
    ),
    userIdx: index("reactions_user_idx").on(t.userId),
    discussionIdx: index("reactions_discussion_idx").on(t.discussionId),
  })
);

// Watch status per member/film
export const watchStatus = pgTable(
  "watch_status",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    filmId: integer("film_id")
      .references(() => films.id, { onDelete: "cascade" })
      .notNull(),
    status: watchStatusEnum("status").default("not_watched").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.userId, t.filmId],
      name: "watch_status_pkey",
    }),
    userIdx: index("watch_status_user_idx").on(t.userId),
    filmIdx: index("watch_status_film_idx").on(t.filmId),
  })
);

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  discussions: many(discussions),
  suggestions: many(suggestions),
  watchStatuses: many(watchStatus),
  invitesCreated: many(invites, { relationName: "invites_created" }),
  invitesUsed: many(invites, { relationName: "invites_used" }),
  filmsSuggested: many(films),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  createdBy: one(users, {
    fields: [invites.createdBy],
    references: [users.id],
    relationName: "invites_created",
  }),
  usedBy: one(users, {
    fields: [invites.usedBy],
    references: [users.id],
    relationName: "invites_used",
  }),
}));

export const filmsRelations = relations(films, ({ one, many }) => ({
  suggestedBy: one(users, {
    fields: [films.suggestedBy],
    references: [users.id],
  }),
  ratings: many(ratings),
  discussions: many(discussions),
  watchStatuses: many(watchStatus),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  film: one(films, {
    fields: [ratings.filmId],
    references: [films.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  film: one(films, { fields: [discussions.filmId], references: [films.id] }),
  user: one(users, { fields: [discussions.userId], references: [users.id] }),
  parent: one(discussions, {
    fields: [discussions.parentId],
    references: [discussions.id],
    relationName: "discussion_parent",
  }),
  replies: many(discussions, { relationName: "discussion_parent" }),
  reactions: many(reactions),
}));

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  user: one(users, { fields: [suggestions.userId], references: [users.id] }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
  discussion: one(discussions, {
    fields: [reactions.discussionId],
    references: [discussions.id],
  }),
}));

export const watchStatusRelations = relations(watchStatus, ({ one }) => ({
  user: one(users, { fields: [watchStatus.userId], references: [users.id] }),
  film: one(films, { fields: [watchStatus.filmId], references: [films.id] }),
}));

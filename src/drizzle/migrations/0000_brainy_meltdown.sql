CREATE TYPE "public"."film_status" AS ENUM('upcoming', 'current', 'archived');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('insightful', 'controversial', 'brilliant');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'selected', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."watch_status" AS ENUM('not_watched', 'watching', 'watched', 'rewatched');--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" serial PRIMARY KEY NOT NULL,
	"film_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" integer,
	"content" text NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"has_spoilers" boolean DEFAULT false NOT NULL,
	"timestamp_reference" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"edited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "films" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"poster_url" text,
	"director" text,
	"runtime" integer,
	"week_start" date NOT NULL,
	"admin_notes" text,
	"suggested_by" uuid,
	"status" "film_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"code" text PRIMARY KEY NOT NULL,
	"created_by" uuid,
	"used_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"film_id" integer NOT NULL,
	"score" numeric(3, 1) NOT NULL,
	"review" text,
	"watched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"discussion_id" integer NOT NULL,
	"type" "reaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"pitch" text NOT NULL,
	"week_suggested" date NOT NULL,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"role" "user_role" NOT NULL,
	"avatar_url" text,
	"joined_at" timestamp with time zone DEFAULT now(),
	"invite_code" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"letterboxd" text,
	"about" text NOT NULL,
	"three_films" text,
	"timezone" text,
	"availability" text NOT NULL,
	"hear" text,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_watch_status" (
	"user_id" uuid NOT NULL,
	"film_id" integer NOT NULL,
	"status" "watch_status" DEFAULT 'not_watched' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_watch_status_pkey" PRIMARY KEY("user_id","film_id")
);
--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "films" ADD CONSTRAINT "films_suggested_by_users_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_discussion_id_discussions_id_fk" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watch_status" ADD CONSTRAINT "user_watch_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watch_status" ADD CONSTRAINT "user_watch_status_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discussions_film_idx" ON "discussions" USING btree ("film_id");--> statement-breakpoint
CREATE INDEX "discussions_parent_idx" ON "discussions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "discussions_user_idx" ON "discussions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "films_week_start_unique" ON "films" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "films_status_idx" ON "films" USING btree ("status");--> statement-breakpoint
CREATE INDEX "films_tmdb_idx" ON "films" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "films_suggested_by_idx" ON "films" USING btree ("suggested_by");--> statement-breakpoint
CREATE INDEX "invites_expires_idx" ON "invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invites_created_by_idx" ON "invites" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "invites_used_by_idx" ON "invites" USING btree ("used_by");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_user_film_unique" ON "ratings" USING btree ("user_id","film_id");--> statement-breakpoint
CREATE INDEX "ratings_user_idx" ON "ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ratings_film_idx" ON "ratings" USING btree ("film_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_user_discussion_unique" ON "reactions" USING btree ("user_id","discussion_id");--> statement-breakpoint
CREATE INDEX "reactions_user_idx" ON "reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reactions_discussion_idx" ON "reactions" USING btree ("discussion_id");--> statement-breakpoint
CREATE INDEX "suggestions_user_idx" ON "suggestions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "suggestions_status_idx" ON "suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "suggestions_week_idx" ON "suggestions" USING btree ("week_suggested");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_invite_code_idx" ON "users" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_created_idx" ON "waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_watch_status_user_idx" ON "user_watch_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_watch_status_film_idx" ON "user_watch_status" USING btree ("film_id");
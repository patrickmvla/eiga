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
CREATE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_created_idx" ON "waitlist" USING btree ("created_at");
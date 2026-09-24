CREATE SCHEMA "app_public";
--> statement-breakpoint
CREATE TABLE "app_public"."campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"length_days" integer NOT NULL,
	"start_at" text NOT NULL,
	"end_at" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_public"."goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"watched_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metric" jsonb,
	"target_date" text,
	"campaign_id" uuid,
	"achieved_at" timestamp with time zone,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_public"."habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"schedule" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_public"."occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"date" text NOT NULL,
	"met_count" integer,
	"target_count" integer NOT NULL,
	"is_rest" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"xp_awarded" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occurrences_habit_date" UNIQUE("habit_id","date")
);
--> statement-breakpoint
CREATE TABLE "app_public"."profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT 'Player' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"week_start" integer DEFAULT 1 NOT NULL,
	"mode" text DEFAULT 'rpg' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_public"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effort" text DEFAULT 'medium' NOT NULL,
	"due_date" text,
	"completed_at" timestamp with time zone,
	"xp_awarded" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_public"."campaigns" ADD CONSTRAINT "campaigns_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."goals" ADD CONSTRAINT "goals_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."goals" ADD CONSTRAINT "goals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "app_public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."habits" ADD CONSTRAINT "habits_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."occurrences" ADD CONSTRAINT "occurrences_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."occurrences" ADD CONSTRAINT "occurrences_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "app_public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_public"."tasks" ADD CONSTRAINT "tasks_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_user_idx" ON "app_public"."campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "app_public"."goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habits_user_idx" ON "app_public"."habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "occurrences_user_date_idx" ON "app_public"."occurrences" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "app_public"."tasks" USING btree ("user_id");
CREATE TABLE "np_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_ai_run" (
	"id" text PRIMARY KEY NOT NULL,
	"task" text NOT NULL,
	"state" text NOT NULL,
	"provenance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proposal" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"created_by" text NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"approved_version" integer,
	"published_version" integer,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_article_slug_unique" UNIQUE("slug"),
	CONSTRAINT "np_article_state" CHECK ("np_article"."state" in ('draft','review','changes','approved','scheduled','published','rejected','archived'))
);
--> statement-breakpoint
CREATE TABLE "np_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_auth_rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "np_auth_rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "np_author" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"specialty" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_author_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "np_award" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"description" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_calendar" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"assignee_id" text,
	"article_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "np_distribution" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"platform" text NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"remote_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"alt" text NOT NULL,
	"created_by" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_nomination" (
	"id" text PRIMARY KEY NOT NULL,
	"award_id" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"winner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_permission" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_poll_option" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_poll" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"question" text NOT NULL,
	"scope" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_poll_slug_unique" UNIQUE("slug"),
	CONSTRAINT "np_poll_dates" CHECK ("np_poll"."ends_at">"np_poll"."starts_at"),
	CONSTRAINT "np_poll_status" CHECK ("np_poll"."status" in ('draft','active','closed'))
);
--> statement-breakpoint
CREATE TABLE "np_ranking_criterion" (
	"id" text PRIMARY KEY NOT NULL,
	"ranking_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_ranking_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"ranking_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "np_positive_position" CHECK ("np_ranking_entry"."position">0)
);
--> statement-breakpoint
CREATE TABLE "np_ranking_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"ranking_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"voter_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_ranking" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"method" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_ranking_slug_unique" UNIQUE("slug"),
	CONSTRAINT "np_ranking_method" CHECK ("np_ranking"."method" in ('editorial','votes','criteria'))
);
--> statement-breakpoint
CREATE TABLE "np_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_review" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"decision" text NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_revision_media" (
	"revision_id" text NOT NULL,
	"media_id" text NOT NULL,
	CONSTRAINT "np_revision_media_revision_id_media_id_pk" PRIMARY KEY("revision_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "np_revision_source" (
	"revision_id" text NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "np_revision_source_revision_id_source_id_pk" PRIMARY KEY("revision_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "np_revision_tag" (
	"revision_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "np_revision_tag_revision_id_tag_id_pk" PRIMARY KEY("revision_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "np_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"kicker" text DEFAULT '' NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"cover" text DEFAULT '' NOT NULL,
	"cover_alt" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'news' NOT NULL,
	"author_id" text NOT NULL,
	"category_id" text NOT NULL,
	"editor_id" text NOT NULL,
	"change_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_role_permission" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "np_role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "np_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "np_source" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_source_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "np_staff" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"can_approve" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribe_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "np_subscriber_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "np_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "np_tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "np_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "np_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "np_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "np_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"option_id" text NOT NULL,
	"voter_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "np_account" ADD CONSTRAINT "np_account_user_id_np_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."np_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_article" ADD CONSTRAINT "np_article_created_by_np_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_audit" ADD CONSTRAINT "np_audit_actor_id_np_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_calendar" ADD CONSTRAINT "np_calendar_assignee_id_np_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_calendar" ADD CONSTRAINT "np_calendar_article_id_np_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."np_article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_distribution" ADD CONSTRAINT "np_distribution_article_id_np_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."np_article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_distribution" ADD CONSTRAINT "np_distribution_revision_id_np_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."np_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_media" ADD CONSTRAINT "np_media_created_by_np_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_nomination" ADD CONSTRAINT "np_nomination_award_id_np_award_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."np_award"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_poll_option" ADD CONSTRAINT "np_poll_option_poll_id_np_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."np_poll"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_ranking_criterion" ADD CONSTRAINT "np_ranking_criterion_ranking_id_np_ranking_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."np_ranking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_ranking_entry" ADD CONSTRAINT "np_ranking_entry_ranking_id_np_ranking_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."np_ranking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_ranking_vote" ADD CONSTRAINT "np_ranking_vote_ranking_id_np_ranking_id_fk" FOREIGN KEY ("ranking_id") REFERENCES "public"."np_ranking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_ranking_vote" ADD CONSTRAINT "np_ranking_vote_entry_id_np_ranking_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."np_ranking_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_review" ADD CONSTRAINT "np_review_article_id_np_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."np_article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_review" ADD CONSTRAINT "np_review_revision_id_np_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."np_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_review" ADD CONSTRAINT "np_review_actor_id_np_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_media" ADD CONSTRAINT "np_revision_media_revision_id_np_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."np_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_media" ADD CONSTRAINT "np_revision_media_media_id_np_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."np_media"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_source" ADD CONSTRAINT "np_revision_source_revision_id_np_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."np_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_source" ADD CONSTRAINT "np_revision_source_source_id_np_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."np_source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_tag" ADD CONSTRAINT "np_revision_tag_revision_id_np_revision_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."np_revision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision_tag" ADD CONSTRAINT "np_revision_tag_tag_id_np_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."np_tag"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision" ADD CONSTRAINT "np_revision_article_id_np_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."np_article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision" ADD CONSTRAINT "np_revision_author_id_np_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."np_author"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision" ADD CONSTRAINT "np_revision_category_id_np_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."np_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_revision" ADD CONSTRAINT "np_revision_editor_id_np_user_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_role_permission" ADD CONSTRAINT "np_role_permission_role_id_np_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."np_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_role_permission" ADD CONSTRAINT "np_role_permission_permission_id_np_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."np_permission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_session" ADD CONSTRAINT "np_session_user_id_np_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."np_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_staff" ADD CONSTRAINT "np_staff_user_id_np_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."np_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_staff" ADD CONSTRAINT "np_staff_role_id_np_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."np_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_vote" ADD CONSTRAINT "np_vote_poll_id_np_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."np_poll"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "np_vote" ADD CONSTRAINT "np_vote_option_id_np_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."np_poll_option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "np_account_provider" ON "np_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "np_article_queue" ON "np_article" USING btree ("state","scheduled_at");--> statement-breakpoint
CREATE INDEX "np_article_public" ON "np_article" USING btree ("is_demo","published_at");--> statement-breakpoint
CREATE INDEX "np_audit_date" ON "np_audit" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "np_distribution_target" ON "np_distribution" USING btree ("revision_id","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "np_ranking_position" ON "np_ranking_entry" USING btree ("ranking_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "np_ranking_vote_once" ON "np_ranking_vote" USING btree ("ranking_id","voter_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "np_revision_number" ON "np_revision" USING btree ("article_id","version");--> statement-breakpoint
CREATE INDEX "np_session_user" ON "np_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "np_vote_once" ON "np_vote" USING btree ("poll_id","voter_hash");
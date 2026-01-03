ALTER TABLE "streamers" ADD COLUMN "slug" varchar(50);--> statement-breakpoint
CREATE INDEX "streamers_slug_idx" ON "streamers" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "streamers" ADD CONSTRAINT "streamers_slug_unique" UNIQUE("slug");
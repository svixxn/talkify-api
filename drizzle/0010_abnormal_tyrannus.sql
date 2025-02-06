ALTER TABLE "messages" ADD COLUMN "files" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "file";
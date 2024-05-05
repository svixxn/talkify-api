ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "age" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slug" varchar NOT NULL;
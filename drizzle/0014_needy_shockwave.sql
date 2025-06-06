ALTER TABLE "chats" ADD COLUMN "isPremium" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isPremium" boolean DEFAULT false;
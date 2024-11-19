ALTER TABLE "messages" ADD COLUMN "isDeletedForAll" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "isDeletedForSender" boolean DEFAULT false;
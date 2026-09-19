ALTER TABLE "transactions" DROP CONSTRAINT "transactions_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "default_monthly_budget" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "name" varchar(200);--> statement-breakpoint
UPDATE "transactions" SET "name" = COALESCE("description", 'Transaction') WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "monthly_budgets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "monthly_budgets" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'IDR';
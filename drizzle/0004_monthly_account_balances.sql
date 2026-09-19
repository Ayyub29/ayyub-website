CREATE TABLE "monthly_account_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"idr_balance" numeric(14, 2) NOT NULL,
	"thb_balance" numeric(14, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_account_balances_year_month" UNIQUE("year","month")
);

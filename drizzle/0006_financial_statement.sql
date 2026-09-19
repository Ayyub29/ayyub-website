CREATE TYPE "public"."liability_kind" AS ENUM('mortgage', 'other');--> statement-breakpoint
CREATE TABLE "financial_liabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "liability_kind" DEFAULT 'other' NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"annual_payment" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_health_thresholds" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" numeric(14, 4) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

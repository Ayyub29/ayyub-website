CREATE TYPE "public"."portfolio_tx_type" AS ENUM('deposit', 'draw', 'buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."portfolio_category" AS ENUM('stock', 'p2p', 'obligasi', 'crypto');--> statement-breakpoint
CREATE TABLE "portfolio_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "portfolio_tx_type" NOT NULL,
	"category" "portfolio_category",
	"name" varchar(200) NOT NULL,
	"value" numeric(14, 4) DEFAULT '0' NOT NULL,
	"transaction_amount" numeric(14, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"description" text,
	"transaction_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_transactions" ADD CONSTRAINT "portfolio_transactions_application_id_portfolio_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."portfolio_applications"("id") ON DELETE restrict ON UPDATE no action;

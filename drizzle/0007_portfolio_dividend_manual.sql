CREATE TABLE IF NOT EXISTS "portfolio_dividend_manual" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "category" "portfolio_category" NOT NULL,
  "name" varchar(200) NOT NULL,
  "annual_amount" numeric(14, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'IDR' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "portfolio_dividend_manual_application_id_portfolio_applications_id_fk"
    FOREIGN KEY ("application_id") REFERENCES "portfolio_applications"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_dividend_manual_position"
  ON "portfolio_dividend_manual" ("application_id", "category", "name");

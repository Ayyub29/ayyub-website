import { relations } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit",
  "cash",
  "investment",
  "other",
]);

export const categoryKindEnum = pgEnum("category_kind", ["income", "expense"]);

export const portfolioTxTypeEnum = pgEnum("portfolio_tx_type", [
  "deposit",
  "draw",
  "buy",
  "sell",
]);

export const portfolioCategoryEnum = pgEnum("portfolio_category", [
  "stock",
  "p2p",
  "obligasi",
  "crypto",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  type: accountTypeEnum("type").default("checking").notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  initialBalance: numeric("initial_balance", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  kind: categoryKindEnum("kind").notNull(),
  color: varchar("color", { length: 7 }).default("#64748b"),
  sortOrder: integer("sort_order").default(0).notNull(),
  defaultMonthlyBudget: numeric("default_monthly_budget", {
    precision: 14,
    scale: 2,
  }),
  budgetCurrency: varchar("budget_currency", { length: 3 }).default("IDR"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** End-of-month cash balances entered manually (IDR + THB accounts). */
export const monthlyAccountBalances = pgTable(
  "monthly_account_balances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    idrBalance: numeric("idr_balance", { precision: 14, scale: 2 }).notNull(),
    thbBalance: numeric("thb_balance", { precision: 14, scale: 2 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("monthly_account_balances_year_month").on(table.year, table.month)],
);

export const portfolioApplications = pgTable("portfolio_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const portfolioTransactions = pgTable("portfolio_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => portfolioApplications.id, { onDelete: "restrict" }),
  type: portfolioTxTypeEnum("type").notNull(),
  category: portfolioCategoryEnum("category"),
  name: varchar("name", { length: 200 }).notNull(),
  /** Units held (e.g. lots, coins); 0 for deposit/draw */
  value: numeric("value", { precision: 14, scale: 4 }).default("0").notNull(),
  transactionAmount: numeric("transaction_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  description: text("description"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 200 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  description: text("description"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const portfolioApplicationsRelations = relations(
  portfolioApplications,
  ({ many }) => ({
    transactions: many(portfolioTransactions),
  }),
);

export const portfolioTransactionsRelations = relations(
  portfolioTransactions,
  ({ one }) => ({
    application: one(portfolioApplications, {
      fields: [portfolioTransactions.applicationId],
      references: [portfolioApplications.id],
    }),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

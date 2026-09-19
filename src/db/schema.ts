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

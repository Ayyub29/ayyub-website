import { relations } from "drizzle-orm";
import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const monthlyBudgets = pgTable(
  "monthly_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    plannedAmount: numeric("planned_amount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("monthly_budgets_category_period_idx").on(
      table.categoryId,
      table.year,
      table.month,
    ),
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  monthlyBudgets: many(monthlyBudgets),
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

export const monthlyBudgetsRelations = relations(monthlyBudgets, ({ one }) => ({
  category: one(categories, {
    fields: [monthlyBudgets.categoryId],
    references: [categories.id],
  }),
}));

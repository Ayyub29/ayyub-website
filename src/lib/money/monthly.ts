import { and, eq, gte, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";

export type BudgetStatus = "over" | "on_track" | "under" | "no_budget";

export type CategoryMonthRow = {
  categoryId: string;
  categoryName: string;
  kind: "income" | "expense";
  color: string | null;
  currency: string;
  planned: number;
  actual: number;
  variance: number;
  status: BudgetStatus;
};

export type MonthlySummary = {
  year: number;
  month: number;
  income: number;
  expenses: number;
  net: number;
  byCategory: CategoryMonthRow[];
  transactions: Array<{
    id: string;
    name: string;
    amount: string;
    currency: string;
    transactionDate: string;
    category: { name: string; kind: "income" | "expense" } | null;
  }>;
};

function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

function budgetStatus(planned: number, actual: number): BudgetStatus {
  if (planned <= 0) {
    return "no_budget";
  }
  if (actual > planned) {
    return "over";
  }
  if (actual < planned) {
    return "under";
  }
  return "on_track";
}

export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<MonthlySummary> {
  const db = getDb();
  const { start, end } = monthBounds(year, month);

  const [categoryRows, monthTransactions] = await Promise.all([
    db
      .select({
        categoryId: schema.categories.id,
        categoryName: schema.categories.name,
        kind: schema.categories.kind,
        color: schema.categories.color,
        defaultBudget: schema.categories.defaultMonthlyBudget,
        actual: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
        sampleCurrency: sql<string>`max(${schema.transactions.currency})`,
      })
      .from(schema.categories)
      .leftJoin(
        schema.transactions,
        and(
          eq(schema.transactions.categoryId, schema.categories.id),
          gte(schema.transactions.transactionDate, start),
          lte(schema.transactions.transactionDate, end),
        ),
      )
      .groupBy(
        schema.categories.id,
        schema.categories.name,
        schema.categories.kind,
        schema.categories.color,
        schema.categories.defaultMonthlyBudget,
      )
      .orderBy(schema.categories.sortOrder, schema.categories.name),
    db.query.transactions.findMany({
      where: and(
        gte(schema.transactions.transactionDate, start),
        lte(schema.transactions.transactionDate, end),
      ),
      orderBy: (tx, { desc }) => [desc(tx.transactionDate), desc(tx.createdAt)],
      with: { category: true },
    }),
  ]);

  let income = 0;
  let expenses = 0;

  const byCategory: CategoryMonthRow[] = categoryRows.map((row) => {
    const actual = Number(row.actual);
    const planned = Number(row.defaultBudget ?? 0);

    if (row.kind === "income") {
      income += actual;
    } else {
      expenses += actual;
    }

    const variance = row.kind === "expense" ? planned - actual : actual - planned;

    return {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      kind: row.kind,
      color: row.color,
      currency: row.sampleCurrency ?? "IDR",
      planned,
      actual,
      variance,
      status:
        row.kind === "expense" ? budgetStatus(planned, actual) : "no_budget",
    };
  });

  return {
    year,
    month,
    income,
    expenses,
    net: income - expenses,
    byCategory,
    transactions: monthTransactions.map((tx) => ({
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      currency: tx.currency,
      transactionDate: tx.transactionDate,
      category: tx.category
        ? { name: tx.category.name, kind: tx.category.kind }
        : null,
    })),
  };
}

export function parseYearMonth(
  yearParam?: string,
  monthParam?: string,
  reference = new Date(),
) {
  const year = yearParam ? Number(yearParam) : reference.getFullYear();
  const month = monthParam ? Number(monthParam) : reference.getMonth() + 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return {
      year: reference.getFullYear(),
      month: reference.getMonth() + 1,
    };
  }

  return { year, month };
}

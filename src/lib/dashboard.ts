import { and, eq, gte, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";

export async function getDashboardSummary(reference = new Date()) {
  const db = getDb();
  const year = reference.getFullYear();
  const month = reference.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0);
  const endStr = end.toISOString().slice(0, 10);

  const [monthlyTotals, accountCount, categoryCount, recentTransactions] =
    await Promise.all([
      db
        .select({
          kind: schema.categories.kind,
          total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
        })
        .from(schema.transactions)
        .innerJoin(
          schema.categories,
          eq(schema.transactions.categoryId, schema.categories.id),
        )
        .where(
          and(
            gte(schema.transactions.transactionDate, start),
            lte(schema.transactions.transactionDate, endStr),
          ),
        )
        .groupBy(schema.categories.kind),
      db.select({ count: sql<number>`count(*)` }).from(schema.accounts),
      db.select({ count: sql<number>`count(*)` }).from(schema.categories),
      db.query.transactions.findMany({
        limit: 8,
        orderBy: (transactions, { desc }) => [
          desc(transactions.transactionDate),
          desc(transactions.createdAt),
        ],
        with: {
          account: true,
          category: true,
        },
      }),
    ]);

  let income = 0;
  let expenses = 0;

  for (const row of monthlyTotals) {
    const total = Number(row.total);
    if (row.kind === "income") {
      income += total;
    } else {
      expenses += Math.abs(total);
    }
  }

  return {
    year,
    month,
    income,
    expenses,
    net: income - expenses,
    accountCount: Number(accountCount[0]?.count ?? 0),
    categoryCount: Number(categoryCount[0]?.count ?? 0),
    recentTransactions,
  };
}

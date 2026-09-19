import { and, gte, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { TransactionLogQuery } from "@/lib/list-query/transaction-log";
import { clampTransactionLogPage } from "@/lib/list-query/transaction-log";

export async function listMoneyTransactions(query: TransactionLogQuery) {
  const db = getDb();
  const where = and(
    gte(schema.transactions.transactionDate, query.from),
    lte(schema.transactions.transactionDate, query.to),
  );

  const countRows = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.transactions)
    .where(where);

  const totalCount = countRows[0]?.count ?? 0;
  const page = clampTransactionLogPage(
    query.page,
    totalCount,
    query.pageSize,
  );
  const offset = (page - 1) * query.pageSize;

  const rows = await db.query.transactions.findMany({
    where,
    orderBy: (transactions, { desc: d }) => [
      d(transactions.transactionDate),
      d(transactions.createdAt),
    ],
    limit: query.pageSize,
    offset,
    with: { category: true },
  });

  return { rows, totalCount, page };
}

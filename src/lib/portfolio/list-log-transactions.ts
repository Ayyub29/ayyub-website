import { and, gte, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type { TransactionLogQuery } from "@/lib/list-query/transaction-log";
import { clampTransactionLogPage } from "@/lib/list-query/transaction-log";

import type { PortfolioTxRow } from "./summary";

export async function listPortfolioLogTransactions(query: TransactionLogQuery) {
  const db = getDb();
  const where = and(
    gte(schema.portfolioTransactions.transactionDate, query.from),
    lte(schema.portfolioTransactions.transactionDate, query.to),
  );

  const countRows = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.portfolioTransactions)
    .where(where);

  const totalCount = countRows[0]?.count ?? 0;
  const page = clampTransactionLogPage(
    query.page,
    totalCount,
    query.pageSize,
  );
  const offset = (page - 1) * query.pageSize;

  const rows = await db.query.portfolioTransactions.findMany({
    where,
    orderBy: (tx, { desc: d }) => [d(tx.transactionDate), d(tx.createdAt)],
    limit: query.pageSize,
    offset,
    with: { application: true },
  });

  const txRows: PortfolioTxRow[] = rows.map((tx) => ({
    id: tx.id,
    type: tx.type,
    category: tx.category,
    name: tx.name,
    value: tx.value,
    transactionAmount: tx.transactionAmount,
    currency: tx.currency,
    description: tx.description,
    transactionDate: tx.transactionDate,
    applicationId: tx.applicationId,
    applicationName: tx.application.name,
  }));

  return { rows: txRows, totalCount, page };
}

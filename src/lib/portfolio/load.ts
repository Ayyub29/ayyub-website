import { getDb } from "@/db";
import { getDisplayMoney } from "@/lib/currency/server-display";

import type { PortfolioTxRow } from "./summary";
import { buildPortfolioSummary } from "./summary";

export async function loadPortfolioData() {
  const db = getDb();
  const money = await getDisplayMoney();

  const [applications, rows] = await Promise.all([
    db.query.portfolioApplications.findMany({
      orderBy: (app, { asc }) => [asc(app.sortOrder), asc(app.name)],
    }),
    db.query.portfolioTransactions.findMany({
      orderBy: (tx, { desc }) => [desc(tx.transactionDate), desc(tx.createdAt)],
      with: { application: true },
    }),
  ]);

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

  const appMap = new Map(applications.map((a) => [a.id, a.name]));

  const summary = buildPortfolioSummary(
    txRows,
    appMap,
    money.displayCurrency,
    money.rates,
  );

  return { applications, rows: txRows, summary, money };
}

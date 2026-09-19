import { and, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { convertWithMatrix } from "@/lib/currency/google-rates";
import type { SupportedCurrency } from "@/lib/currencies";
import { loadPortfolioData } from "@/lib/portfolio/load";
import type { ValuedApplicationSummary } from "@/lib/portfolio/quotes";
import { parseYearMonth } from "@/lib/money/monthly";

export type PortfolioAppAmountRow = {
  applicationId: string;
  applicationName: string;
  idleCashDisplay: number;
  investmentsDisplay: number;
  totalDisplay: number;
  hasUnpricedHoldings: boolean;
};

export type AccountOverview = {
  year: number;
  month: number;
  idrBalance: number | null;
  thbBalance: number | null;
  idrDisplay: number;
  thbDisplay: number;
  bankTotalDisplay: number;
  portfolioApps: PortfolioAppAmountRow[];
  portfolioTotalDisplay: number;
  grandTotalDisplay: number;
  displayCurrency: SupportedCurrency;
};

export function portfolioAppAmounts(
  app: ValuedApplicationSummary,
): Omit<PortfolioAppAmountRow, "applicationId" | "applicationName"> {
  let investmentsDisplay = 0;
  let hasUnpricedHoldings = false;

  for (const holding of app.holdings) {
    if (holding.valuation.currentAmountDisplay != null) {
      investmentsDisplay += holding.valuation.currentAmountDisplay;
    } else if (holding.quantity > 0) {
      hasUnpricedHoldings = true;
      investmentsDisplay += holding.netInvestedDisplay;
    }
  }

  return {
    idleCashDisplay: app.idleCashDisplay,
    investmentsDisplay,
    totalDisplay: app.idleCashDisplay + investmentsDisplay,
    hasUnpricedHoldings,
  };
}

export async function loadAccountOverview(): Promise<{
  overview: AccountOverview;
  money: Awaited<ReturnType<typeof loadPortfolioData>>["money"];
}> {
  const { year, month } = parseYearMonth();
  const db = getDb();
  const { summary, money } = await loadPortfolioData();

  const balanceRow = await db.query.monthlyAccountBalances.findFirst({
    where: and(
      eq(schema.monthlyAccountBalances.year, year),
      eq(schema.monthlyAccountBalances.month, month),
    ),
  });

  const idrBalance = balanceRow ? Number(balanceRow.idrBalance) : null;
  const thbBalance = balanceRow ? Number(balanceRow.thbBalance) : null;

  const idrDisplay =
    idrBalance != null
      ? convertWithMatrix(
          idrBalance,
          "IDR",
          money.displayCurrency,
          money.rates,
        )
      : 0;
  const thbDisplay =
    thbBalance != null
      ? convertWithMatrix(
          thbBalance,
          "THB",
          money.displayCurrency,
          money.rates,
        )
      : 0;

  const portfolioApps: PortfolioAppAmountRow[] = summary.byApplication.map(
    (app) => ({
      applicationId: app.applicationId,
      applicationName: app.applicationName,
      ...portfolioAppAmounts(app),
    }),
  );

  const portfolioTotalDisplay = portfolioApps.reduce(
    (sum, row) => sum + row.totalDisplay,
    0,
  );

  const bankTotalDisplay = idrDisplay + thbDisplay;
  const grandTotalDisplay = bankTotalDisplay + portfolioTotalDisplay;

  return {
    overview: {
      year,
      month,
      idrBalance,
      thbBalance,
      idrDisplay,
      thbDisplay,
      bankTotalDisplay,
      portfolioApps,
      portfolioTotalDisplay,
      grandTotalDisplay,
      displayCurrency: money.displayCurrency,
    },
    money,
  };
}

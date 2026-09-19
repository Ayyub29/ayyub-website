import type { PortfolioCategory } from "@/lib/portfolio/constants";
import type { ValuedHoldingRow, ValuedPortfolioSummary } from "@/lib/portfolio/quotes";

export type StatementAssetLine = { label: string; amount: number };

export type StatementAssetGroups = {
  liquid: { total: number; lines: StatementAssetLine[] };
  investment: { total: number; lines: StatementAssetLine[] };
  total: number;
};

function holdingDisplayAmount(holding: ValuedHoldingRow): number {
  if (holding.valuation.currentAmountDisplay != null) {
    return holding.valuation.currentAmountDisplay;
  }
  if (holding.quantity > 0) {
    return holding.netInvestedDisplay;
  }
  return 0;
}

function normalizeAppName(name: string): string {
  return name.trim().toLowerCase();
}

export function isBibitApplication(applicationName: string): boolean {
  return normalizeAppName(applicationName) === "bibit";
}

/** Liquid on statement: Bibit app holdings in Obligasi / SBN only. */
export function isLiquidPortfolioHolding(
  applicationName: string,
  category: PortfolioCategory,
): boolean {
  return isBibitApplication(applicationName) && category === "obligasi";
}

export function buildStatementAssetGroups(
  summary: ValuedPortfolioSummary,
  bank: { idrDisplay: number; thbDisplay: number },
): StatementAssetGroups {
  const liquidLines: StatementAssetLine[] = [
    { label: "IDR account", amount: bank.idrDisplay },
    { label: "THB bank", amount: bank.thbDisplay },
  ];

  const investmentByApp = new Map<string, number>();

  for (const app of summary.byApplication) {
    const bibit = isBibitApplication(app.applicationName);

    if (Math.abs(app.idleCashDisplay) > 0.0001) {
      if (bibit) {
        liquidLines.push({
          label: "Bibit — idle cash",
          amount: app.idleCashDisplay,
        });
      } else {
        investmentByApp.set(
          app.applicationName,
          (investmentByApp.get(app.applicationName) ?? 0) +
            app.idleCashDisplay,
        );
      }
    }

    for (const holding of app.holdings) {
      const amount = holdingDisplayAmount(holding);
      if (Math.abs(amount) < 0.0001) {
        continue;
      }

      if (isLiquidPortfolioHolding(app.applicationName, holding.category)) {
        liquidLines.push({
          label: `Bibit — ${holding.name} (Obligasi / SBN)`,
          amount,
        });
      } else {
        investmentByApp.set(
          app.applicationName,
          (investmentByApp.get(app.applicationName) ?? 0) + amount,
        );
      }
    }
  }

  const liquidTotal = liquidLines.reduce((sum, line) => sum + line.amount, 0);

  const investmentLines: StatementAssetLine[] = [...investmentByApp.entries()]
    .filter(([, amount]) => Math.abs(amount) > 0.0001)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([appName, amount]) => ({
      label: `${appName} (portfolio)`,
      amount,
    }));

  const investmentTotal = investmentLines.reduce(
    (sum, line) => sum + line.amount,
    0,
  );

  return {
    liquid: { total: liquidTotal, lines: liquidLines },
    investment: { total: investmentTotal, lines: investmentLines },
    total: liquidTotal + investmentTotal,
  };
}

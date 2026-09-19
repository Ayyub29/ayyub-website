import { getDb } from "@/db";
import { loadAccountOverview } from "@/lib/accounts/overview";
import type { SupportedCurrency } from "@/lib/currencies";
import { convertWithMatrix } from "@/lib/currency/google-rates";
import { getYearlySummary } from "@/lib/money/yearly";

import {
  getFinanceHealthThresholds,
  type FinanceHealthThresholds,
} from "./health-thresholds";
import {
  buildStatementAssetGroups,
  type StatementAssetGroups,
} from "./statement-assets";

export type HealthStatus = "good" | "warn" | "bad" | "na";

export type HealthIndicatorRow = {
  id: string;
  name: string;
  nameId: string;
  numeratorLabel: string;
  denominatorLabel: string;
  value: number | null;
  valueLabel: string;
  targetLabel: string;
  status: HealthStatus;
};

export type FinancialStatement = {
  year: number;
  displayCurrency: SupportedCurrency;
  assets: StatementAssetGroups;
  liabilities: {
    total: number;
    lines: Array<{
      id: string;
      name: string;
      kind: "mortgage" | "other";
      amount: number;
      annualPaymentDisplay: number;
    }>;
  };
  equity: number;
  netWorth: number;
  liquidAssets: number;
  investmentAssets: number;
  totalDebt: number;
  annualIncome: number;
  annualSavings: number;
  avgMonthlyExpense: number;
  annualLoanPayments: number;
  annualNonMortgagePayments: number;
  indicators: HealthIndicatorRow[];
};

function formatMonths(value: number) {
  return `${value.toFixed(1)} mo`;
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function statusRangeMonths(
  value: number | null,
  min: number,
  max: number,
): HealthStatus {
  if (value == null || Number.isNaN(value)) {
    return "na";
  }
  if (value < min) {
    return "bad";
  }
  if (value > max) {
    return "warn";
  }
  return "good";
}

function statusMin(value: number | null, min: number): HealthStatus {
  if (value == null || Number.isNaN(value)) {
    return "na";
  }
  return value >= min ? "good" : "bad";
}

function statusMax(value: number | null, max: number): HealthStatus {
  if (value == null || Number.isNaN(value)) {
    return "na";
  }
  return value <= max ? "good" : "bad";
}

function buildIndicators(
  data: Omit<FinancialStatement, "indicators">,
  thresholds: FinanceHealthThresholds,
): HealthIndicatorRow[] {
  const liquidityMonths =
    data.avgMonthlyExpense > 0
      ? data.liquidAssets / data.avgMonthlyExpense
      : null;

  const liquidToEquity =
    data.netWorth > 0 ? data.liquidAssets / data.netWorth : null;

  const savingRatio =
    data.annualIncome > 0 ? data.annualSavings / data.annualIncome : null;

  const debtToAssets =
    data.assets.total > 0 ? data.totalDebt / data.assets.total : null;

  const debtRepayment =
    data.annualIncome > 0
      ? data.annualLoanPayments / data.annualIncome
      : null;

  const nonMortgageRepayment =
    data.annualIncome > 0
      ? data.annualNonMortgagePayments / data.annualIncome
      : null;

  const investmentToEquity =
    data.netWorth > 0 ? data.investmentAssets / data.netWorth : null;

  const solvability =
    data.assets.total > 0 ? data.netWorth / data.assets.total : null;

  return [
    {
      id: "liquidity",
      name: "Liquidity Ratio",
      nameId: "Rasio Likuiditas",
      numeratorLabel: "Cash & equivalents",
      denominatorLabel: "Monthly expenses",
      value: liquidityMonths,
      valueLabel:
        liquidityMonths != null ? formatMonths(liquidityMonths) : "—",
      targetLabel: `${thresholds.liquidity_months_min}–${thresholds.liquidity_months_max} months`,
      status: statusRangeMonths(
        liquidityMonths,
        thresholds.liquidity_months_min,
        thresholds.liquidity_months_max,
      ),
    },
    {
      id: "liquid_equity",
      name: "Liquid to Net Equity Ratio",
      nameId: "Rasio Likuiditas terhadap Ekuitas",
      numeratorLabel: "Liquid assets",
      denominatorLabel: "Net worth",
      value: liquidToEquity,
      valueLabel: liquidToEquity != null ? formatPct(liquidToEquity) : "—",
      targetLabel: `Min ${formatPct(thresholds.liquid_to_equity_min)}`,
      status: statusMin(liquidToEquity, thresholds.liquid_to_equity_min),
    },
    {
      id: "saving",
      name: "Saving Ratio",
      nameId: "Rasio Tabungan",
      numeratorLabel: "Annual savings",
      denominatorLabel: "Annual income",
      value: savingRatio,
      valueLabel: savingRatio != null ? formatPct(savingRatio) : "—",
      targetLabel: `Min ${formatPct(thresholds.saving_ratio_min)}`,
      status: statusMin(savingRatio, thresholds.saving_ratio_min),
    },
    {
      id: "debt_assets",
      name: "Debt to Assets Ratio",
      nameId: "Rasio Hutang terhadap Aset",
      numeratorLabel: "Total debt",
      denominatorLabel: "Total assets",
      value: debtToAssets,
      valueLabel: debtToAssets != null ? formatPct(debtToAssets) : "—",
      targetLabel: `Max ${formatPct(thresholds.debt_to_assets_max)}`,
      status: statusMax(debtToAssets, thresholds.debt_to_assets_max),
    },
    {
      id: "debt_repayment",
      name: "Debt Repayment Capacity",
      nameId: "Kemampuan Pelunasan Hutang",
      numeratorLabel: "Annual loan payments",
      denominatorLabel: "Annual income",
      value: debtRepayment,
      valueLabel: debtRepayment != null ? formatPct(debtRepayment) : "—",
      targetLabel: `Max ${formatPct(thresholds.debt_repayment_max)}`,
      status: statusMax(debtRepayment, thresholds.debt_repayment_max),
    },
    {
      id: "non_mortgage_repayment",
      name: "Non-Mortgage Debt Repayment",
      nameId: "Pelunasan Hutang Non Hipotek",
      numeratorLabel: "Non-mortgage annual payments",
      denominatorLabel: "Annual income",
      value: nonMortgageRepayment,
      valueLabel:
        nonMortgageRepayment != null ? formatPct(nonMortgageRepayment) : "—",
      targetLabel: `Max ${formatPct(thresholds.non_mortgage_repayment_max)}`,
      status: statusMax(
        nonMortgageRepayment,
        thresholds.non_mortgage_repayment_max,
      ),
    },
    {
      id: "investment_equity",
      name: "Investment to Net Equity",
      nameId: "Investasi terhadap Ekuitas",
      numeratorLabel: "Investment assets",
      denominatorLabel: "Net worth",
      value: investmentToEquity,
      valueLabel:
        investmentToEquity != null ? formatPct(investmentToEquity) : "—",
      targetLabel: `Min ${formatPct(thresholds.investment_to_equity_min)}`,
      status: statusMin(investmentToEquity, thresholds.investment_to_equity_min),
    },
    {
      id: "solvability",
      name: "Solvability Ratio",
      nameId: "Rasio Solvabilitas",
      numeratorLabel: "Net worth",
      denominatorLabel: "Total assets",
      value: solvability,
      valueLabel: solvability != null ? formatPct(solvability) : "—",
      targetLabel: `Min ${formatPct(thresholds.solvability_min)}`,
      status: statusMin(solvability, thresholds.solvability_min),
    },
  ];
}

export async function loadFinancialStatement(
  year = new Date().getFullYear(),
): Promise<{
  statement: FinancialStatement;
  money: Awaited<ReturnType<typeof loadAccountOverview>>["money"];
}> {
  const db = getDb();
  const { overview, summary, money } = await loadAccountOverview();
  const displayCurrency = money.displayCurrency;

  const [yearly, liabilities, thresholds] = await Promise.all([
    getYearlySummary(year, {
      displayCurrency,
      rates: money.rates,
    }),
    db.query.financialLiabilities.findMany({
      orderBy: (row, { asc }) => [asc(row.sortOrder), asc(row.name)],
    }),
    getFinanceHealthThresholds(),
  ]);

  const assets = buildStatementAssetGroups(summary, {
    idrDisplay: overview.idrDisplay,
    thbDisplay: overview.thbDisplay,
  });
  const liquidAssets = assets.liquid.total;
  const investmentAssets = assets.investment.total;

  const liabilityLines = liabilities.map((row) => {
    const amount = convertWithMatrix(
      Number(row.balance),
      row.currency as SupportedCurrency,
      displayCurrency,
      money.rates,
    );
    const annualPaymentDisplay = convertWithMatrix(
      Number(row.annualPayment),
      row.currency as SupportedCurrency,
      displayCurrency,
      money.rates,
    );
    return {
      id: row.id,
      name: row.name,
      kind: row.kind,
      amount,
      annualPaymentDisplay,
    };
  });

  const totalDebt = liabilityLines.reduce((sum, row) => sum + row.amount, 0);
  const totalAssets = assets.total;

  const equity = totalAssets - totalDebt;
  const netWorth = equity;

  const monthsWithExpense = yearly.months.filter(
    (m) => m.expensesExcludingGoalInvestment > 0,
  ).length;
  const divisor = monthsWithExpense > 0 ? monthsWithExpense : 12;
  const avgMonthlyExpense =
    yearly.expensesExcludingGoalInvestment / divisor;

  let annualSavings =
    yearly.savingRate.saveAmount != null
      ? yearly.savingRate.investment + yearly.savingRate.saveAmount
      : null;
  if (annualSavings == null && yearly.income > 0) {
    annualSavings =
      yearly.income -
      yearly.expensesExcludingGoalInvestment -
      yearly.investment;
  }
  if (annualSavings == null) {
    annualSavings = 0;
  }

  const annualLoanPayments = liabilityLines.reduce(
    (sum, row) => sum + row.annualPaymentDisplay,
    0,
  );
  const annualNonMortgagePayments = liabilityLines
    .filter((row) => row.kind === "other")
    .reduce((sum, row) => sum + row.annualPaymentDisplay, 0);

  const base = {
    year,
    displayCurrency,
    assets,
    liabilities: {
      total: totalDebt,
      lines: liabilityLines,
    },
    equity,
    netWorth,
    liquidAssets,
    investmentAssets,
    totalDebt,
    annualIncome: yearly.income,
    annualSavings,
    avgMonthlyExpense,
    annualLoanPayments,
    annualNonMortgagePayments,
  };

  return {
    statement: {
      ...base,
      indicators: buildIndicators(base, thresholds),
    },
    money,
  };
}

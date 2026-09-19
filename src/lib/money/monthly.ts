import { and, eq, gte, lte } from "drizzle-orm";

import { getDb, schema } from "@/db";
import {
  isExcludedFromSummaryExpense,
  isInvestmentCategory,
} from "@/lib/categories/expense-summary";
import type { SupportedCurrency } from "@/lib/currencies";
import {
  convertWithMatrix,
  type ExchangeRateMatrix,
} from "@/lib/currency/google-rates";

export type BudgetStatus = "over" | "on_track" | "under" | "no_budget";

export type CategoryMonthRow = {
  categoryId: string;
  categoryName: string;
  kind: "income" | "expense";
  color: string | null;
  planned: number;
  actual: number;
  variance: number;
  status: BudgetStatus;
};

export type MonthlySavingRate = {
  income: number;
  /** Day-to-day expenses (excludes Goal & Investment categories) */
  expense: number;
  investment: number;
  idrBalance: number | null;
  thbBalance: number | null;
  totalBalance: number | null;
  previousTotalBalance: number | null;
  /** Change in total balance vs previous month (display currency) */
  saveAmount: number | null;
  /** (investment + saveAmount) / income when balance change is available */
  savingRatio: number | null;
};

export type MonthlySummary = {
  year: number;
  month: number;
  income: number;
  expenses: number;
  /** Expenses excluding Goal and Investment categories */
  expensesExcludingGoalInvestment: number;
  investment: number;
  net: number;
  /** Income minus expensesExcludingGoalInvestment */
  netExcludingGoalInvestment: number;
  savingRate: MonthlySavingRate;
  displayCurrency: SupportedCurrency;
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

export type MonthlySummaryOptions = {
  displayCurrency: SupportedCurrency;
  rates: ExchangeRateMatrix;
};

function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

export function previousYearMonth(year: number, month: number) {
  if (month <= 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export type AccountBalanceRow = {
  idrBalance: string;
  thbBalance: string;
};

export function totalBalanceInDisplay(
  idrBalance: string | null | undefined,
  thbBalance: string | null | undefined,
  options: MonthlySummaryOptions,
): number | null {
  if (idrBalance == null || thbBalance == null) {
    return null;
  }
  const idr = Number(idrBalance);
  const thb = Number(thbBalance);
  if (Number.isNaN(idr) || Number.isNaN(thb)) {
    return null;
  }
  return (
    toDisplayAmount(idr, "IDR", options) +
    toDisplayAmount(thb, "THB", options)
  );
}

export function buildSavingRate(
  income: number,
  expense: number,
  investment: number,
  balanceRow: AccountBalanceRow | null | undefined,
  previousBalanceRow: AccountBalanceRow | null | undefined,
  options: MonthlySummaryOptions,
): MonthlySavingRate {
  const idrBalance = balanceRow ? Number(balanceRow.idrBalance) : null;
  const thbBalance = balanceRow ? Number(balanceRow.thbBalance) : null;
  const totalBalance = balanceRow
    ? totalBalanceInDisplay(
        balanceRow.idrBalance,
        balanceRow.thbBalance,
        options,
      )
    : null;
  const previousTotalBalance = previousBalanceRow
    ? totalBalanceInDisplay(
        previousBalanceRow.idrBalance,
        previousBalanceRow.thbBalance,
        options,
      )
    : null;

  const saveAmount =
    totalBalance != null && previousTotalBalance != null
      ? totalBalance - previousTotalBalance
      : null;

  const savingRatio =
    saveAmount != null && income > 0
      ? (investment + saveAmount) / income
      : null;

  return {
    income,
    expense,
    investment,
    idrBalance,
    thbBalance,
    totalBalance,
    previousTotalBalance,
    saveAmount,
    savingRatio,
  };
}

export function accumulateFlowTotals(
  transactions: Array<{
    amount: string;
    currency: string;
    category: { name: string; kind: "income" | "expense" } | null;
  }>,
  options: MonthlySummaryOptions,
) {
  let income = 0;
  let expenses = 0;
  let expensesExcludingGoalInvestment = 0;
  let investment = 0;

  for (const tx of transactions) {
    const converted = toDisplayAmount(Number(tx.amount), tx.currency, options);
    if (tx.category?.kind === "income") {
      income += converted;
    } else if (tx.category?.kind === "expense") {
      expenses += converted;
      if (isInvestmentCategory(tx.category.name)) {
        investment += converted;
      }
      if (!isExcludedFromSummaryExpense(tx.category.name)) {
        expensesExcludingGoalInvestment += converted;
      }
    }
  }

  return {
    income,
    expenses,
    expensesExcludingGoalInvestment,
    investment,
    net: income - expenses,
    netExcludingGoalInvestment: income - expensesExcludingGoalInvestment,
  };
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

export function toDisplayAmount(
  amount: number,
  from: string,
  options: MonthlySummaryOptions,
): number {
  const fromCurrency = (
    from.length === 3 ? from : options.displayCurrency
  ) as SupportedCurrency;
  return convertWithMatrix(
    amount,
    fromCurrency,
    options.displayCurrency,
    options.rates,
  );
}

export async function getMonthlySummary(
  year: number,
  month: number,
  options: MonthlySummaryOptions,
): Promise<MonthlySummary> {
  const db = getDb();
  const { start, end } = monthBounds(year, month);

  const prev = previousYearMonth(year, month);

  const [categories, monthTransactions, balanceRow, previousBalanceRow] =
    await Promise.all([
    db.query.categories.findMany({
      orderBy: (cat, { asc }) => [asc(cat.sortOrder), asc(cat.name)],
    }),
    db.query.transactions.findMany({
      where: and(
        gte(schema.transactions.transactionDate, start),
        lte(schema.transactions.transactionDate, end),
      ),
      orderBy: (tx, { desc }) => [desc(tx.transactionDate), desc(tx.createdAt)],
      with: { category: true },
    }),
    db.query.monthlyAccountBalances.findFirst({
      where: and(
        eq(schema.monthlyAccountBalances.year, year),
        eq(schema.monthlyAccountBalances.month, month),
      ),
    }),
    db.query.monthlyAccountBalances.findFirst({
      where: and(
        eq(schema.monthlyAccountBalances.year, prev.year),
        eq(schema.monthlyAccountBalances.month, prev.month),
      ),
    }),
  ]);

  const actualByCategory = new Map<string, number>();

  for (const tx of monthTransactions) {
    const converted = toDisplayAmount(Number(tx.amount), tx.currency, options);

    if (tx.categoryId) {
      actualByCategory.set(
        tx.categoryId,
        (actualByCategory.get(tx.categoryId) ?? 0) + converted,
      );
    }
  }

  const {
    income,
    expenses,
    expensesExcludingGoalInvestment,
    investment,
    net,
    netExcludingGoalInvestment,
  } = accumulateFlowTotals(monthTransactions, options);

  const byCategory: CategoryMonthRow[] = categories.map((category) => {
    const actual = actualByCategory.get(category.id) ?? 0;
    const planned = category.defaultMonthlyBudget
      ? toDisplayAmount(
          Number(category.defaultMonthlyBudget),
          category.budgetCurrency ?? options.displayCurrency,
          options,
        )
      : 0;
    const variance =
      category.kind === "expense" ? planned - actual : actual - planned;

    return {
      categoryId: category.id,
      categoryName: category.name,
      kind: category.kind,
      color: category.color,
      planned,
      actual,
      variance,
      status:
        category.kind === "expense"
          ? budgetStatus(planned, actual)
          : "no_budget",
    };
  });

  const savingRate = buildSavingRate(
    income,
    expensesExcludingGoalInvestment,
    investment,
    balanceRow,
    previousBalanceRow,
    options,
  );

  return {
    year,
    month,
    income,
    expenses,
    expensesExcludingGoalInvestment,
    investment,
    net,
    netExcludingGoalInvestment,
    savingRate,
    displayCurrency: options.displayCurrency,
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

export async function getLatestMonthlyAccountBalance() {
  const db = getDb();
  return db.query.monthlyAccountBalances.findFirst({
    orderBy: (row, { desc }) => [desc(row.year), desc(row.month)],
  });
}

export function monthNeedsAccountBalances(
  balanceRow: AccountBalanceRow | null | undefined,
): boolean {
  if (!balanceRow) {
    return true;
  }
  return (
    balanceRow.idrBalance == null ||
    balanceRow.thbBalance == null ||
    balanceRow.idrBalance === "" ||
    balanceRow.thbBalance === ""
  );
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

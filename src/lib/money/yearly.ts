import { and, eq, gte, lte, or } from "drizzle-orm";

import { getDb, schema } from "@/db";

import {
  accumulateFlowTotals,
  buildSavingRate,
  previousYearMonth,
  type MonthlySavingRate,
  type MonthlySummaryOptions,
} from "./monthly";

export type YearlyMonthRow = {
  month: number;
  income: number;
  expenses: number;
  expensesExcludingGoalInvestment: number;
  investment: number;
  net: number;
  netExcludingGoalInvestment: number;
  savingRate: MonthlySavingRate;
};

export type YearlySummary = {
  year: number;
  income: number;
  expenses: number;
  expensesExcludingGoalInvestment: number;
  investment: number;
  net: number;
  netExcludingGoalInvestment: number;
  savingRate: MonthlySavingRate;
  months: YearlyMonthRow[];
  displayCurrency: MonthlySummaryOptions["displayCurrency"];
};

function balanceKey(year: number, month: number) {
  return `${year}-${month}`;
}

export async function getYearlySummary(
  year: number,
  options: MonthlySummaryOptions,
): Promise<YearlySummary> {
  const db = getDb();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [yearTransactions, balanceRows] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        gte(schema.transactions.transactionDate, start),
        lte(schema.transactions.transactionDate, end),
      ),
      with: { category: true },
    }),
    db.query.monthlyAccountBalances.findMany({
      where: or(
        and(
          eq(schema.monthlyAccountBalances.year, year),
          gte(schema.monthlyAccountBalances.month, 1),
          lte(schema.monthlyAccountBalances.month, 12),
        ),
        and(
          eq(schema.monthlyAccountBalances.year, year - 1),
          eq(schema.monthlyAccountBalances.month, 12),
        ),
      ),
    }),
  ]);

  const balanceByMonth = new Map(
    balanceRows.map((row) => [balanceKey(row.year, row.month), row]),
  );

  const txsByMonth = new Map<number, typeof yearTransactions>();
  for (const tx of yearTransactions) {
    const month = Number(tx.transactionDate.slice(5, 7));
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      continue;
    }
    const list = txsByMonth.get(month) ?? [];
    list.push(tx);
    txsByMonth.set(month, list);
  }

  const months: YearlyMonthRow[] = [];
  let income = 0;
  let expenses = 0;
  let expensesExcludingGoalInvestment = 0;
  let investment = 0;

  for (let month = 1; month <= 12; month += 1) {
    const monthTxs = txsByMonth.get(month) ?? [];
    const flows = accumulateFlowTotals(monthTxs, options);
    const prev = previousYearMonth(year, month);
    const balanceRow = balanceByMonth.get(balanceKey(year, month));
    const previousBalanceRow = balanceByMonth.get(
      balanceKey(prev.year, prev.month),
    );

    const savingRate = buildSavingRate(
      flows.income,
      flows.expensesExcludingGoalInvestment,
      flows.investment,
      balanceRow,
      previousBalanceRow,
      options,
    );

    months.push({
      month,
      ...flows,
      savingRate,
    });

    income += flows.income;
    expenses += flows.expenses;
    expensesExcludingGoalInvestment += flows.expensesExcludingGoalInvestment;
    investment += flows.investment;
  }

  const net = income - expenses;
  const netExcludingGoalInvestment =
    income - expensesExcludingGoalInvestment;

  const decemberBalance = balanceByMonth.get(balanceKey(year, 12));
  const previousDecemberBalance = balanceByMonth.get(balanceKey(year - 1, 12));

  const savingRate = buildSavingRate(
    income,
    expensesExcludingGoalInvestment,
    investment,
    decemberBalance,
    previousDecemberBalance,
    options,
  );

  return {
    year,
    income,
    expenses,
    expensesExcludingGoalInvestment,
    investment,
    net,
    netExcludingGoalInvestment,
    savingRate,
    months,
    displayCurrency: options.displayCurrency,
  };
}

export function parseYear(yearParam?: string, reference = new Date()) {
  const year = yearParam ? Number(yearParam) : reference.getFullYear();

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { year: reference.getFullYear() };
  }

  return { year };
}

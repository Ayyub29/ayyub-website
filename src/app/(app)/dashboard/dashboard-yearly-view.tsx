import Link from "next/link";

import { SavingRateMetricsTable } from "@/components/saving-rate-metrics-table";
import { SummaryKpiGrid } from "@/components/summary-kpi-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DisplayMoney } from "@/lib/currency/server-display";
import { formatMonthShort, formatPercent } from "@/lib/format";
import type { YearlySummary } from "@/lib/money/yearly";

type DashboardYearlyViewProps = {
  year: number;
  summary: YearlySummary;
  money: DisplayMoney;
};

function monthlyDashboardHref(year: number, month: number) {
  return `/dashboard?view=monthly&year=${year}&month=${month}`;
}

export function DashboardYearlyView({
  year,
  summary,
  money,
}: DashboardYearlyViewProps) {
  const { displayCurrency } = money;
  const formatDisplay = (amount: number) =>
    money.format(amount, displayCurrency);

  return (
    <>
      <SummaryKpiGrid
        formatAmount={formatDisplay}
        income={summary.income}
        expenses={summary.expenses}
        expensesExcludingGoalInvestment={summary.expensesExcludingGoalInvestment}
        net={summary.net}
        netExcludingGoalInvestment={summary.netExcludingGoalInvestment}
      />

      <Card>
        <CardHeader>
          <CardTitle>Expense summary by month</CardTitle>
          <CardDescription>
            Same totals as the monthly view. Click a month to edit transactions
            or enter account balances.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Total expenses</TableHead>
                <TableHead className="text-right">Excl. Goal & Inv.</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Net excl. G&I</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.months.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>
                    <Link
                      href={monthlyDashboardHref(year, row.month)}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatMonthShort(row.month)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDisplay(row.income)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDisplay(row.expenses)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDisplay(row.expensesExcludingGoalInvestment)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDisplay(row.net)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDisplay(row.netExcludingGoalInvestment)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-medium">
                <TableCell>Year total</TableCell>
                <TableCell className="text-right">
                  {formatDisplay(summary.income)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDisplay(summary.expenses)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDisplay(summary.expensesExcludingGoalInvestment)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDisplay(summary.net)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDisplay(summary.netExcludingGoalInvestment)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saving rate by month</CardTitle>
          <CardDescription>
            Balances are entered on each month&apos;s summary. Save amount is
            month-over-month change in total balance; saving ratio is
            (investment + save amount) ÷ income.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expense</TableHead>
                <TableHead className="text-right">Investment</TableHead>
                <TableHead className="text-right">IDR balance</TableHead>
                <TableHead className="text-right">THB balance</TableHead>
                <TableHead className="text-right">Total ({displayCurrency})</TableHead>
                <TableHead className="text-right">Save amount</TableHead>
                <TableHead className="text-right">Saving ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.months.map((row) => {
                const s = row.savingRate;
                return (
                  <TableRow key={row.month}>
                    <TableCell>
                      <Link
                        href={monthlyDashboardHref(year, row.month)}
                        className="font-medium text-primary hover:underline"
                      >
                        {formatMonthShort(row.month)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDisplay(s.income)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDisplay(s.expense)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDisplay(s.investment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.idrBalance != null
                        ? money.format(s.idrBalance, "IDR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.thbBalance != null
                        ? money.format(s.thbBalance, "THB")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.totalBalance != null
                        ? formatDisplay(s.totalBalance)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.saveAmount != null
                        ? formatDisplay(s.saveAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.savingRatio != null
                        ? formatPercent(s.savingRatio)
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Year saving rate</CardTitle>
          <CardDescription>
            Flow totals are summed across the year. End-of-year balances use
            December {year}; save amount compares December {year} to December{" "}
            {year - 1}. Saving ratio uses full-year investment plus that balance
            change, divided by income. Enter balances in the monthly view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SavingRateMetricsTable
            saving={summary.savingRate}
            displayCurrency={displayCurrency}
            formatDisplay={formatDisplay}
            formatIdr={(amount) => money.format(amount, "IDR")}
            formatThb={(amount) => money.format(amount, "THB")}
          />
        </CardContent>
      </Card>
    </>
  );
}

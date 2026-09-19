import { MonthlyBalanceForm } from "@/components/monthly-balance-form";
import { SavingRateMetricsTable } from "@/components/saving-rate-metrics-table";
import { SummaryKpiGrid } from "@/components/summary-kpi-grid";
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { Badge } from "@/components/ui/badge";
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
import { formatBudgetInputAmount } from "@/lib/format";
import type { DisplayMoney } from "@/lib/currency/server-display";
import type { MonthlySummary } from "@/lib/money/monthly";

type DashboardMonthlyViewProps = {
  year: number;
  month: number;
  summary: MonthlySummary;
  money: DisplayMoney;
};

export function DashboardMonthlyView({
  year,
  month,
  summary,
  money,
}: DashboardMonthlyViewProps) {
  const expenseRows = summary.byCategory.filter((row) => row.kind === "expense");
  const incomeRows = summary.byCategory.filter((row) => row.kind === "income");
  const { displayCurrency } = money;
  const saving = summary.savingRate;

  const idrFormDefault =
    saving.idrBalance != null
      ? formatBudgetInputAmount(saving.idrBalance, "IDR")
      : "";
  const thbFormDefault =
    saving.thbBalance != null
      ? formatBudgetInputAmount(saving.thbBalance, "THB")
      : "";

  return (
    <>
      <SummaryKpiGrid
        formatAmount={(amount) => money.format(amount, displayCurrency)}
        income={summary.income}
        expenses={summary.expenses}
        expensesExcludingGoalInvestment={summary.expensesExcludingGoalInvestment}
        net={summary.net}
        netExcludingGoalInvestment={summary.netExcludingGoalInvestment}
      />

      <Card>
        <CardHeader>
          <CardTitle>Monthly saving rate</CardTitle>
          <CardDescription>
            Enter end-of-month IDR and THB account balances. Total balance sums
            both in {displayCurrency}. Save amount is the change in total
            balance vs the previous month; saving ratio is save amount divided
            by income.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MonthlyBalanceForm
            year={year}
            month={month}
            idrDefault={idrFormDefault}
            thbDefault={thbFormDefault}
          />

          <SavingRateMetricsTable
            saving={saving}
            displayCurrency={displayCurrency}
            formatDisplay={(amount) => money.format(amount, displayCurrency)}
            formatIdr={(amount) => money.format(amount, "IDR")}
            formatThb={(amount) => money.format(amount, "THB")}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs actual</CardTitle>
            <CardDescription>
              Configure budgets in Settings → Budget.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No expense categories yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseRows
                    .filter((row) => row.actual > 0 || row.planned > 0)
                    .map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell>{row.categoryName}</TableCell>
                        <TableCell className="text-right">
                          {money.format(row.planned, displayCurrency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {money.format(row.actual, displayCurrency)}
                        </TableCell>
                        <TableCell>
                          <BudgetStatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income by category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeRows.every((row) => row.actual === 0) ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No income recorded this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeRows
                    .filter((row) => row.actual > 0)
                    .map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell>{row.categoryName}</TableCell>
                        <TableCell className="text-right">
                          {money.format(row.actual, displayCurrency)}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions this month</CardTitle>
          <CardDescription>{summary.transactions.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Value ({displayCurrency})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                summary.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.transactionDate}</TableCell>
                    <TableCell>{tx.name}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="secondary">{tx.category.name}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>{money.formatConverted(tx.amount, tx.currency)}</div>
                      {tx.currency !== displayCurrency ? (
                        <div className="text-xs text-muted-foreground">
                          {tx.amount} {tx.currency}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

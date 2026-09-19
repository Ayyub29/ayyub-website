import { getDisplayMoney } from "@/lib/currency/server-display";
import { formatMonthYear } from "@/lib/format";
import { getMonthlySummary, parseYearMonth } from "@/lib/money/monthly";
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { MonthNav } from "@/components/month-nav";
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

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { year, month } = parseYearMonth(params.year, params.month);

  let summary;
  let money;
  let setupRequired = false;

  try {
    money = await getDisplayMoney();
    summary = await getMonthlySummary(year, month, {
      displayCurrency: money.displayCurrency,
      rates: money.rates,
    });
  } catch {
    setupRequired = true;
  }

  if (setupRequired || !summary || !money) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Monthly summary</h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>
              Set <code className="text-xs">DATABASE_URL</code>, run{" "}
              <code className="text-xs">npm run db:push</code>, then add categories
              and transactions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const expenseRows = summary.byCategory.filter((row) => row.kind === "expense");
  const incomeRows = summary.byCategory.filter((row) => row.kind === "income");
  const { displayCurrency } = money;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly summary</h1>
          <p className="text-sm text-muted-foreground">
            {formatMonthYear(year, month)} · all amounts in {displayCurrency}
          </p>
        </div>
        <MonthNav year={year} month={month} basePath="/dashboard" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl">
              {money.format(summary.income, displayCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total expenses</CardDescription>
            <CardTitle className="text-2xl">
              {money.format(summary.expenses, displayCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expenses (excl. Goal & Investment)</CardDescription>
            <CardTitle className="text-2xl">
              {money.format(
                summary.expensesExcludingGoalInvestment,
                displayCurrency,
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net</CardDescription>
            <CardTitle className="text-2xl">
              {money.format(summary.net, displayCurrency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net (excl. Goal & Investment)</CardDescription>
            <CardTitle className="text-2xl">
              {money.format(
                summary.netExcludingGoalInvestment,
                displayCurrency,
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

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
    </div>
  );
}

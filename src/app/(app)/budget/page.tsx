import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { formatMoney, formatMonthYear } from "@/lib/format";
import {
  getMonthlySummary,
  parseYearMonth,
} from "@/lib/money/monthly";
import { BudgetConfigRow } from "@/components/budget-config-row";
import { BudgetStatusBadge } from "@/components/budget-status-badge";
import { MonthNav } from "@/components/month-nav";
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

type BudgetPageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const params = await searchParams;
  const { year, month } = parseYearMonth(params.year, params.month);

  let summary;
  let configRows: Array<{
    categoryId: string;
    categoryName: string;
    defaultBudget: string | null;
  }> = [];

  try {
    const db = getDb();
    summary = await getMonthlySummary(year, month);

    const expenseCategories = await db.query.categories.findMany({
      where: eq(schema.categories.kind, "expense"),
      orderBy: (cat, { asc }) => [asc(cat.sortOrder), asc(cat.name)],
    });

    configRows = expenseCategories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      defaultBudget: cat.defaultMonthlyBudget,
    }));
  } catch {
    summary = null;
  }

  const expenseRows =
    summary?.byCategory.filter((row) => row.kind === "expense") ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly budget per expense category. The same limit applies every
          month.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category budgets</CardTitle>
          <CardDescription>
            Planned spending limits used for over/under budget checks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add expense categories first (
              <code className="text-xs">npm run db:seed:categories</code>).
            </p>
          ) : (
            configRows.map((row) => (
              <BudgetConfigRow
                key={row.categoryId}
                categoryId={row.categoryId}
                categoryName={row.categoryName}
                defaultBudget={row.defaultBudget}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Status</h2>
          <p className="text-sm text-muted-foreground">
            Actual spending for {formatMonthYear(year, month)}
          </p>
        </div>
        <MonthNav year={year} month={month} basePath="/budget" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs actual</CardTitle>
          <CardDescription>Over budget when spent exceeds the limit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No data for this month.
                  </TableCell>
                </TableRow>
              ) : (
                expenseRows.map((row) => (
                  <TableRow key={row.categoryId}>
                    <TableCell>{row.categoryName}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.planned, row.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.actual, row.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.variance, row.currency)}
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
    </div>
  );
}

import { eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import {
  getDisplayMoney,
  type DisplayMoney,
} from "@/lib/currency/server-display";
import { formatBudgetInputAmount, formatMonthYear } from "@/lib/format";
import { getMonthlySummary, parseYearMonth } from "@/lib/money/monthly";
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

export default async function SettingsBudgetPage({
  searchParams,
}: BudgetPageProps) {
  const params = await searchParams;
  const { year, month } = parseYearMonth(params.year, params.month);

  let summary;
  let configRows: Array<{
    categoryId: string;
    categoryName: string;
    displayAmount: string;
    storedAmount: string | null;
    storedCurrency: string | null;
  }> = [];
  let money: DisplayMoney | null = null;

  try {
    money = await getDisplayMoney();
    const db = getDb();
    summary = await getMonthlySummary(year, month, {
      displayCurrency: money.displayCurrency,
      rates: money.rates,
    });

    const expenseCategories = await db.query.categories.findMany({
      where: eq(schema.categories.kind, "expense"),
      orderBy: (cat, { asc }) => [asc(cat.sortOrder), asc(cat.name)],
    });

    const displayMoney = money;
    configRows = expenseCategories.map((cat) => {
      const storedCurrency = cat.budgetCurrency ?? "IDR";
      const converted =
        cat.defaultMonthlyBudget != null
          ? displayMoney.convert(cat.defaultMonthlyBudget, storedCurrency)
          : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        storedAmount: cat.defaultMonthlyBudget,
        storedCurrency: cat.budgetCurrency,
        displayAmount: formatBudgetInputAmount(
          converted,
          displayMoney.displayCurrency,
        ),
      };
    });
  } catch {
    summary = null;
    money = null;
  }

  const expenseRows =
    summary?.byCategory.filter((row) => row.kind === "expense") ?? [];
  const displayCurrency = money?.displayCurrency ?? "IDR";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Budget</h2>
        <p className="text-sm text-muted-foreground">
          Budgets convert to your display currency ({displayCurrency}) using
          Google Finance rates. Saving stores the amount in {displayCurrency}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category budgets</CardTitle>
          <CardDescription>
            Enter limits in {displayCurrency}. Toggle currency in the header to
            view converted values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add expense categories in Categories settings first.
            </p>
          ) : (
            configRows.map((row) => (
              <BudgetConfigRow
                key={row.categoryId}
                categoryId={row.categoryId}
                categoryName={row.categoryName}
                displayAmount={row.displayAmount}
                displayCurrency={displayCurrency}
                storedAmount={row.storedAmount}
                storedCurrency={row.storedCurrency}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Status</h3>
          <p className="text-sm text-muted-foreground">
            Spending in {formatMonthYear(year, month)} (converted to{" "}
            {displayCurrency})
          </p>
        </div>
        <MonthNav year={year} month={month} basePath="/settings/budget" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs actual</CardTitle>
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
                      {money?.format(row.planned, displayCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money?.format(row.actual, displayCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money?.format(row.variance, displayCurrency)}
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

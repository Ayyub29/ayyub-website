import { and, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { formatMoney, formatMonthYear } from "@/lib/format";
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

export default async function BudgetPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let rows: Array<{
    categoryName: string;
    planned: string;
    actual: string;
  }> = [];

  try {
    const db = getDb();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    rows = await db
      .select({
        categoryName: schema.categories.name,
        planned: sql<string>`coalesce(${schema.monthlyBudgets.plannedAmount}, 0)`,
        actual: sql<string>`coalesce(sum(abs(${schema.transactions.amount})), 0)`,
      })
      .from(schema.categories)
      .leftJoin(
        schema.monthlyBudgets,
        and(
          eq(schema.monthlyBudgets.categoryId, schema.categories.id),
          eq(schema.monthlyBudgets.year, year),
          eq(schema.monthlyBudgets.month, month),
        ),
      )
      .leftJoin(
        schema.transactions,
        and(
          eq(schema.transactions.categoryId, schema.categories.id),
          sql`${schema.transactions.transactionDate} >= ${start}`,
          sql`${schema.transactions.transactionDate} <= ${end}`,
        ),
      )
      .where(eq(schema.categories.kind, "expense"))
      .groupBy(schema.categories.name, schema.monthlyBudgets.plannedAmount)
      .orderBy(schema.categories.name);
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
        <p className="text-sm text-muted-foreground">
          Planned vs actual for {formatMonthYear(year, month)} (expense categories).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly budget</CardTitle>
          <CardDescription>
            Variance = planned minus actual spending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No budget rows yet. Seed data or add monthly budgets in the
                    database.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const planned = Number(row.planned);
                  const actual = Number(row.actual);
                  const variance = planned - actual;

                  return (
                    <TableRow key={row.categoryName}>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(planned)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(actual)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(variance)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

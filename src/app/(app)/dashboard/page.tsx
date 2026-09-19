import { desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { formatMoney, formatMonthYear } from "@/lib/format";
import { getDashboardSummary } from "@/lib/dashboard";
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

export default async function DashboardPage() {
  let summary;
  let setupRequired = false;

  try {
    summary = await getDashboardSummary();
  } catch {
    setupRequired = true;
  }

  if (setupRequired || !summary) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>
              Add <code className="text-xs">DATABASE_URL</code> to{" "}
              <code className="text-xs">.env.local</code>, then run{" "}
              <code className="text-xs">npm run db:push</code> and{" "}
              <code className="text-xs">npm run db:seed</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const db = getDb();
  const categoryBreakdown = await db
    .select({
      categoryName: schema.categories.name,
      kind: schema.categories.kind,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`,
    })
    .from(schema.transactions)
    .innerJoin(
      schema.categories,
      eq(schema.transactions.categoryId, schema.categories.id),
    )
    .where(
      sql`extract(year from ${schema.transactions.transactionDate}) = ${summary.year}
          and extract(month from ${schema.transactions.transactionDate}) = ${summary.month}`,
    )
    .groupBy(schema.categories.name, schema.categories.kind)
    .orderBy(desc(sql`sum(${schema.transactions.amount})`));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {formatMonthYear(summary.year, summary.month)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(summary.income)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expenses</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(summary.expenses)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net</CardDescription>
            <CardTitle className="text-2xl">{formatMoney(summary.net)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Setup</CardDescription>
            <CardTitle className="text-2xl">
              {summary.accountCount} acct · {summary.categoryCount} cat
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No transactions yet. Run the seed script or add data from
                      Transactions.
                    </TableCell>
                  </TableRow>
                ) : (
                  categoryBreakdown.map((row) => (
                    <TableRow key={`${row.categoryName}-${row.kind}`}>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.total)}
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
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.transactionDate}</TableCell>
                      <TableCell>
                        {tx.description ?? tx.category?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

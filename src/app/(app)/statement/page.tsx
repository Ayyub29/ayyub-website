import Link from "next/link";

import { HealthStatusBadge } from "@/components/health-status-badge";
import { buttonVariants } from "@/components/ui/button";
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
import { loadFinancialStatement } from "@/lib/finance/statement";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FinancialStatementPage() {
  const year = new Date().getFullYear();
  let data;

  try {
    data = await loadFinancialStatement(year);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Financial statement
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>Run migrations and add your data first.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { statement, money } = data;
  const format = (n: number) => money.format(n, statement.displayCurrency);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Financial statement
          </h1>
          <p className="text-sm text-muted-foreground">
            Assets, liabilities & equity · health metrics for {year} ·{" "}
            {statement.displayCurrency}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/liabilities"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit liabilities
          </Link>
          <Link
            href="/settings/finance-health"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Health thresholds
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {statement.assets.lines.map((line) => (
                  <TableRow key={line.label}>
                    <TableCell>{line.label}</TableCell>
                    <TableCell className="text-right">
                      {format(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell>Total assets</TableCell>
                  <TableCell className="text-right">
                    {format(statement.assets.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities & equity</CardTitle>
            <CardDescription>
              Liabilities from Settings → Liabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {statement.liabilities.lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No liabilities recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  statement.liabilities.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {line.kind === "mortgage" ? "mortgage" : "other"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {format(line.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="font-medium">
                  <TableCell>Total liabilities</TableCell>
                  <TableCell className="text-right">
                    {format(statement.liabilities.total)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell>Equity (net worth)</TableCell>
                  <TableCell className="text-right">
                    {format(statement.equity)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal finance health</CardTitle>
          <CardDescription>
            Based on your configured thresholds. Income & expenses use calendar
            year {year}; cash from Accounts; investments at market prices where
            available.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicator</TableHead>
                <TableHead>Numerator</TableHead>
                <TableHead>Denominator</TableHead>
                <TableHead className="text-right">Your value</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.indicators.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.nameId}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.numeratorLabel}</TableCell>
                  <TableCell className="text-sm">{row.denominatorLabel}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.valueLabel}
                  </TableCell>
                  <TableCell className="text-sm">{row.targetLabel}</TableCell>
                  <TableCell>
                    <HealthStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

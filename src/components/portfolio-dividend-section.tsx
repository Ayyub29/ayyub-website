"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatMoney } from "@/lib/format";
import type {
  DividendProjection,
  ManualDividendHoldingOption,
  ManualDividendRow,
} from "@/lib/portfolio/dividends";
import { PORTFOLIO_CATEGORY_LABELS } from "@/lib/portfolio/constants";
import type { SupportedCurrency } from "@/lib/currencies";

import {
  PortfolioManualDividendDialog,
  type ManualDividendEditTarget,
} from "./portfolio-manual-dividend-dialog";

type PortfolioDividendSectionProps = {
  projection: DividendProjection;
  holdingOptions: ManualDividendHoldingOption[];
  manualRows: ManualDividendRow[];
  displayCurrency: SupportedCurrency;
};

function sourceLabel(source: DividendProjection["rows"][0]["source"]) {
  switch (source) {
    case "yahoo":
      return "Yahoo (TTM)";
    case "manual":
      return "Manual";
    default:
      return "Not set";
  }
}

export function PortfolioDividendSection({
  projection,
  holdingOptions,
  manualRows,
  displayCurrency,
}: PortfolioDividendSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ManualDividendEditTarget | null>(
    null,
  );
  const [initialPositionKey, setInitialPositionKey] = useState<
    string | undefined
  >();

  const manualByKey = useMemo(() => {
    const map = new Map<string, ManualDividendRow>();
    for (const row of manualRows) {
      map.set(
        `${row.applicationId}|${row.category}|${row.name.toLowerCase()}`,
        row,
      );
    }
    return map;
  }, [manualRows]);

  const formatDisplay = (amount: number) =>
    formatMoney(amount, displayCurrency);

  function openAdd(positionKey?: string) {
    setEditTarget(null);
    setInitialPositionKey(positionKey);
    setDialogOpen(true);
  }

  function openEdit(row: DividendProjection["rows"][0]) {
    if (row.source !== "manual") {
      return;
    }
    const manual = manualByKey.get(
      `${row.applicationId}|${row.category}|${row.name.toLowerCase()}`,
    );
    if (!manual || row.category === "stock") {
      return;
    }
    setInitialPositionKey(undefined);
    setEditTarget({
      applicationId: row.applicationId,
      category: row.category,
      name: row.name,
      annualAmount: manual.annualAmount,
      currency: manual.currency as SupportedCurrency,
    });
    setDialogOpen(true);
  }

  const hasNonStockHoldings = holdingOptions.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Dividend projection</CardTitle>
            <CardDescription>
              Estimated passive income from investments only (not salary or bank
              interest). IDX stocks: trailing 12-month dividends per share from
              Yahoo Finance × your lots (100 shares/lot). Other assets: enter
              annual income manually.
            </CardDescription>
          </div>
          {hasNonStockHoldings ? (
            <Button type="button" size="sm" onClick={() => openAdd()}>
              + Manual income
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Projected annual</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatDisplay(projection.totalAnnualDisplay)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Projected monthly (÷ 12)
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatDisplay(projection.totalMonthlyDisplay)}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Annual</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead>Source</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No open positions. Buy assets to see dividend projection.
                  </TableCell>
                </TableRow>
              ) : (
                projection.rows.map((row) => (
                  <TableRow
                    key={`${row.applicationId}-${row.category}-${row.name}`}
                  >
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.applicationName}
                      </div>
                      {row.detail ? (
                        <div className="text-xs text-muted-foreground">
                          {row.detail}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PORTFOLIO_CATEGORY_LABELS[row.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.source === "unset"
                        ? "—"
                        : formatDisplay(row.annualDisplay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.source === "unset"
                        ? "—"
                        : formatDisplay(row.monthlyDisplay)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.source === "unset" ? "outline" : "secondary"
                        }
                      >
                        {sourceLabel(row.source)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.source === "manual" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                      ) : row.source === "unset" &&
                        row.category !== "stock" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openAdd(
                              `${row.applicationId}|${row.category}|${row.name}`,
                            )
                          }
                        >
                          Add
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PortfolioManualDividendDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holdingOptions={holdingOptions}
        editTarget={editTarget}
        initialPositionKey={initialPositionKey}
      />
    </>
  );
}

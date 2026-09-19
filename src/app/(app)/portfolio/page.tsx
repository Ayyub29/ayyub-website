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
import { HoldingValuationCells } from "@/components/holding-valuation-cells";
import { PortfolioDividendSection } from "@/components/portfolio-dividend-section";
import { getDb } from "@/db";
import { PORTFOLIO_CATEGORY_LABELS } from "@/lib/portfolio/constants";
import {
  buildDividendProjection,
  manualDividendHoldingOptions,
  type ManualDividendRow,
} from "@/lib/portfolio/dividends";
import { loadPortfolioData } from "@/lib/portfolio/load";
import {
  sumNetInvestedDisplay,
  sumPricedCostBasisDisplay,
  sumUnrealizedPnlDisplay,
  holdingUnrealizedPnlDisplay,
  unrealizedReturnRatio,
} from "@/lib/portfolio/pnl";
import { sumCurrentAmountDisplay } from "@/lib/portfolio/quotes";
import { UnrealizedPnlCell } from "@/components/unrealized-pnl-cell";
import { formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

export default async function PortfolioSummaryPage() {
  let data;
  try {
    data = await loadPortfolioData();
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>
              Set <code className="text-xs">DATABASE_URL</code>, run{" "}
              <code className="text-xs">npm run db:push</code> and{" "}
              <code className="text-xs">npm run db:seed:portfolio</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { summary, money } = data;
  const { displayCurrency } = money;
  const formatDisplay = (amount: number) =>
    money.format(amount, displayCurrency);

  let dividendProjection = null;
  let manualRows: ManualDividendRow[] = [];
  let dividendReady = false;

  try {
    const db = getDb();
    const rows = await db.query.portfolioDividendManual.findMany();
    manualRows = rows.map((row) => ({
      applicationId: row.applicationId,
      category: row.category,
      name: row.name,
      annualAmount: row.annualAmount,
      currency: row.currency,
    }));
    dividendProjection = await buildDividendProjection(
      summary,
      manualRows,
      displayCurrency,
      money.rates,
    );
    dividendReady = true;
  } catch {
    dividendReady = false;
  }

  const dividendHoldingOptions = dividendReady
    ? manualDividendHoldingOptions(summary, manualRows)
    : [];

  const totalCostBasis = sumNetInvestedDisplay(summary.holdings);
  const totalMarketValue = sumCurrentAmountDisplay(summary.holdings);
  const totalUnrealizedPnl = sumUnrealizedPnlDisplay(summary.holdings);
  const pricedCostBasis = sumPricedCostBasisDisplay(summary.holdings);
  const totalReturnRatio = unrealizedReturnRatio(
    totalUnrealizedPnl,
    pricedCostBasis,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio summary</h1>
        <p className="text-sm text-muted-foreground">
          Holdings and idle cash from your transaction log · market values in{" "}
          {displayCurrency} (header toggle)
        </p>
      </div>

      {summary.holdings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Market value (quoted)</CardDescription>
              <CardTitle className="text-2xl">
                {formatDisplay(totalMarketValue)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cost basis (open positions)</CardDescription>
              <CardTitle className="text-2xl">
                {formatDisplay(totalCostBasis)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unrealized P/L (quoted only)</CardDescription>
              <CardTitle className="text-2xl">
                <UnrealizedPnlCell
                  pnl={totalUnrealizedPnl}
                  costBasis={pricedCostBasis}
                  formatDisplay={formatDisplay}
                  className="text-left [&>div]:text-2xl [&>div]:font-semibold"
                />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unrealized return</CardDescription>
              <CardTitle className="text-2xl">
                {totalReturnRatio != null ? (
                  <span
                    className={
                      totalReturnRatio >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {totalReturnRatio >= 0 ? "+" : ""}
                    {formatPercent(totalReturnRatio)}
                  </span>
                ) : (
                  "—"
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      {summary.holdings.length > 0 ? (
        <p className="text-xs text-muted-foreground -mt-4">
          Floating P/L = current price − net invested per line (display currency).
          IDX: Yahoo ({`*.JK`}). BTC: CoinGecko. P2P/obligasi without quotes show
          — until priced. Stock units are lots (100 shares).
        </p>
      ) : null}

      {dividendReady && dividendProjection ? (
        <PortfolioDividendSection
          projection={dividendProjection}
          holdingOptions={dividendHoldingOptions}
          manualRows={manualRows}
          displayCurrency={displayCurrency}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dividend projection</CardTitle>
            <CardDescription>
              Run <code className="text-xs">npm run db:push</code> to enable
              dividend projection and manual income entries.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Investments held</CardTitle>
          <CardDescription>
            Open positions with net cost basis and current amount where a live
            quote is available.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Application</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Current price</TableHead>
                <TableHead className="text-right">Current amount</TableHead>
                <TableHead className="text-right">Net invested</TableHead>
                <TableHead className="text-right">Unrealized P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.holdings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    No open positions yet. Log a buy transaction to start.
                  </TableCell>
                </TableRow>
              ) : (
                summary.holdings.map((row) => (
                  <TableRow
                    key={`${row.applicationId}-${row.category}-${row.name}`}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PORTFOLIO_CATEGORY_LABELS[row.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.applicationName}</TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(row.quantity)}
                      {row.category === "stock" ? (
                        <div className="text-xs text-muted-foreground">lots</div>
                      ) : null}
                    </TableCell>
                    <HoldingValuationCells
                      row={row}
                      formatDisplay={formatDisplay}
                      formatMoney={(amount, currency) =>
                        money.format(amount, currency)
                      }
                    />
                    <TableCell className="text-right">
                      {formatDisplay(row.netInvestedDisplay)}
                    </TableCell>
                    <TableCell>
                      <UnrealizedPnlCell
                        pnl={holdingUnrealizedPnlDisplay(row)}
                        costBasis={row.netInvestedDisplay}
                        formatDisplay={formatDisplay}
                      />
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
          <CardTitle>By application</CardTitle>
          <CardDescription>
            Idle cash stays inside each app until you buy, sell, or draw.
            Deposits and sell proceeds increase idle cash; buys and draws reduce
            it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {summary.byApplication.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add apps in Settings → Portfolio apps, or run{" "}
              <code className="text-xs">npm run db:seed:portfolio</code>.
            </p>
          ) : (
            summary.byApplication.map((app) => (
              <div key={app.applicationId} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{app.applicationName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Idle cash (total):{" "}
                    <span className="font-medium text-foreground">
                      {formatDisplay(app.idleCashDisplay)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(app.idleCashByCurrency)
                    .filter(([, amount]) => Math.abs(amount) > 0.0001)
                    .map(([currency, amount]) => (
                      <Badge key={currency} variant="outline">
                        {money.format(amount, currency)} {currency}
                      </Badge>
                    ))}
                  {Object.values(app.idleCashByCurrency).every(
                    (a) => Math.abs(a) < 0.0001,
                  ) ? (
                    <span className="text-sm text-muted-foreground">
                      No idle cash
                    </span>
                  ) : null}
                </div>
                {app.holdings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Net invested</TableHead>
                        <TableHead className="text-right">Unrealized P/L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {app.holdings.map((h) => (
                        <TableRow key={`${h.category}-${h.name}`}>
                          <TableCell>{h.name}</TableCell>
                          <TableCell>
                            {PORTFOLIO_CATEGORY_LABELS[h.category]}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatQuantity(h.quantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            {h.valuation.currentAmountDisplay != null
                              ? formatDisplay(h.valuation.currentAmountDisplay)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDisplay(h.netInvestedDisplay)}
                          </TableCell>
                          <TableCell>
                            <UnrealizedPnlCell
                              pnl={holdingUnrealizedPnlDisplay(h)}
                              costBasis={h.netInvestedDisplay}
                              formatDisplay={formatDisplay}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No holdings</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {summary.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holdings by category yet.</p>
          ) : (
            summary.byCategory.map((group) => {
              const groupPnl = sumUnrealizedPnlDisplay(group.holdings);
              const groupPnlPositive = groupPnl >= 0;
              return (
              <div key={group.category} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{group.categoryLabel}</h3>
                  <p className="text-sm text-muted-foreground">
                    Net invested{" "}
                    <span className="font-medium text-foreground">
                      {formatDisplay(group.netInvestedDisplay)}
                    </span>
                    {" · "}
                    Current{" "}
                    <span className="font-medium text-foreground">
                      {formatDisplay(sumCurrentAmountDisplay(group.holdings))}
                    </span>
                    {" · "}
                    Unrealized{" "}
                    <span
                      className={
                        groupPnlPositive
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "font-medium text-red-600 dark:text-red-400"
                      }
                    >
                      {groupPnlPositive ? "+" : ""}
                      {formatDisplay(groupPnl)}
                    </span>
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Net invested</TableHead>
                      <TableHead className="text-right">Unrealized P/L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.holdings.map((h) => (
                      <TableRow key={`${h.applicationId}-${h.name}`}>
                        <TableCell>{h.name}</TableCell>
                        <TableCell>{h.applicationName}</TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(h.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {h.valuation.currentAmountDisplay != null
                            ? formatDisplay(h.valuation.currentAmountDisplay)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDisplay(h.netInvestedDisplay)}
                        </TableCell>
                        <TableCell>
                          <UnrealizedPnlCell
                            pnl={holdingUnrealizedPnlDisplay(h)}
                            costBasis={h.netInvestedDisplay}
                            formatDisplay={formatDisplay}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

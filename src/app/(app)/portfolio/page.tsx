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
import { PORTFOLIO_CATEGORY_LABELS } from "@/lib/portfolio/constants";
import { loadPortfolioData } from "@/lib/portfolio/load";
import { sumCurrentAmountDisplay } from "@/lib/portfolio/quotes";

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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mark-to-market (quoted assets)</CardDescription>
            <CardTitle className="text-2xl">
              {formatDisplay(sumCurrentAmountDisplay(summary.holdings))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              IDX stocks: Yahoo Finance ({`*.JK`}, 15 min cache). BTC: CoinGecko.
              P2P & obligasi have no live price yet. Stock units are lots (100
              shares).
            </p>
          </CardContent>
        </Card>
      ) : null}

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.holdings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
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
            summary.byCategory.map((group) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

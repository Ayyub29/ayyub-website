import Link from "next/link";

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
import { loadAccountOverview } from "@/lib/accounts/overview";
import { formatBudgetInputAmount, formatMonthYear } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  let data;

  try {
    data = await loadAccountOverview();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Account overview</h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>
              Set <code className="text-xs">DATABASE_URL</code> and run{" "}
              <code className="text-xs">npm run db:push</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { overview, money } = data;
  const { displayCurrency } = money;
  const formatDisplay = (amount: number) =>
    money.format(amount, displayCurrency);

  const hasBankBalances =
    overview.balanceYear != null && overview.balanceMonth != null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account overview</h1>
        <p className="text-sm text-muted-foreground">
          Last saved bank balances plus portfolio apps (idle cash + live
          investment values where available) · totals in {displayCurrency}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total across bank + portfolio apps</CardDescription>
          <CardTitle className="text-3xl">
            {formatDisplay(overview.grandTotalDisplay)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            Bank:{" "}
            <span className="font-medium text-foreground">
              {formatDisplay(overview.bankTotalDisplay)}
            </span>
          </span>
          <span>
            Portfolio apps:{" "}
            <span className="font-medium text-foreground">
              {formatDisplay(overview.portfolioTotalDisplay)}
            </span>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank accounts</CardTitle>
          <CardDescription>
            {hasBankBalances ? (
              <>
                Showing end-of-month balances from{" "}
                {formatMonthYear(overview.balanceYear!, overview.balanceMonth!)}
                . Enter a new month on{" "}
                <Link href="/dashboard" className="text-foreground underline">
                  Summary
                </Link>
                .
              </>
            ) : (
              <>
                No balances saved yet. Add them from{" "}
                <Link href="/dashboard" className="text-foreground underline">
                  Summary
                </Link>
                .
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">IDR account</TableCell>
                <TableCell className="text-right">
                  {overview.idrBalance != null
                    ? money.format(overview.idrBalance, "IDR")
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {overview.idrBalance != null
                    ? formatDisplay(overview.idrDisplay)
                    : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">THB bank</TableCell>
                <TableCell className="text-right">
                  {overview.thbBalance != null
                    ? money.format(overview.thbBalance, "THB")
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {overview.thbBalance != null
                    ? formatDisplay(overview.thbDisplay)
                    : "—"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/40 font-medium">
                <TableCell>Bank subtotal</TableCell>
                <TableCell />
                <TableCell className="text-right">
                  {formatDisplay(overview.bankTotalDisplay)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio applications</CardTitle>
          <CardDescription>
            Per app: idle cash from your transaction log plus investments at
            current price (Yahoo/CoinGecko). Unpriced positions (e.g. SBN) use
            net invested cost instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead className="text-right">Idle cash</TableHead>
                <TableHead className="text-right">Investments</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.portfolioApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No portfolio applications. Add them in Settings → Portfolio
                    apps.
                  </TableCell>
                </TableRow>
              ) : (
                overview.portfolioApps.map((row) => (
                  <TableRow key={row.applicationId}>
                    <TableCell className="font-medium">
                      {row.applicationName}
                      {row.hasUnpricedHoldings ? (
                        <Badge variant="outline" className="ml-2 text-xs">
                          incl. cost basis
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDisplay(row.idleCashDisplay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDisplay(row.investmentsDisplay)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDisplay(row.totalDisplay)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {overview.portfolioApps.length > 0 ? (
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell>Portfolio subtotal</TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right">
                    {formatDisplay(overview.portfolioTotalDisplay)}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

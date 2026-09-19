import { DeletePortfolioTransactionButton } from "@/components/delete-portfolio-transaction-button";
import { PortfolioTransactionForm } from "@/components/portfolio-transaction-form";
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
import { loadPortfolioData } from "@/lib/portfolio/load";
import {
  PORTFOLIO_CATEGORY_LABELS,
  PORTFOLIO_TX_TYPE_LABELS,
} from "@/lib/portfolio/constants";

export const dynamic = "force-dynamic";

function formatQuantity(value: string) {
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);
}

export default async function PortfolioTransactionsPage() {
  const today = new Date().toISOString().slice(0, 10);
  let data;

  try {
    data = await loadPortfolioData();
  } catch {
    data = null;
  }

  const applications = data?.applications ?? [];
  const rows = data?.rows ?? [];
  const money = data?.money;
  const displayCurrency = money?.displayCurrency ?? "IDR";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Portfolio transaction log
        </h1>
        <p className="text-sm text-muted-foreground">
          Deposits and draws move idle cash inside an app; buys and sells use
          that cash for positions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add entry</CardTitle>
          <CardDescription>
            Examples: buy BBCA in Ajaib, deposit to ALAMI, SBN coupon in Bibit,
            draw from IBKR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add applications in Settings → Portfolio apps, or run{" "}
              <code className="text-xs">npm run db:seed:portfolio</code> for the
              starter list.
            </p>
          ) : (
            <PortfolioTransactionForm
              applications={applications.map((a) => ({
                id: a.id,
                name: a.name,
              }))}
              defaultDate={today}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
          <CardDescription>{rows.length} entries</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-muted-foreground">
                    No portfolio transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.transactionDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PORTFOLIO_TX_TYPE_LABELS[tx.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.name}</TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(tx.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money
                        ? money.formatConverted(
                            tx.transactionAmount,
                            tx.currency,
                          )
                        : tx.transactionAmount}
                    </TableCell>
                    <TableCell>{tx.currency}</TableCell>
                    <TableCell>{tx.applicationName}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="secondary">
                          {PORTFOLIO_CATEGORY_LABELS[tx.category]}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                      {tx.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <DeletePortfolioTransactionButton id={tx.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {money ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Amount column converted to {displayCurrency} where shown; original
              currency kept in the Currency column.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

import { getDb } from "@/db";
import { formatMoney } from "@/lib/format";
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

export default async function TransactionsPage() {
  let rows;

  try {
    const db = getDb();
    rows = await db.query.transactions.findMany({
      orderBy: (transactions, { desc: d }) => [
        d(transactions.transactionDate),
        d(transactions.createdAt),
      ],
      with: {
        account: true,
        category: true,
      },
    });
  } catch {
    rows = [] as NonNullable<typeof rows>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Ledger view — add/edit forms coming next.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All transactions</CardTitle>
          <CardDescription>Sorted by date (newest first)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No transactions yet. Run{" "}
                    <code className="text-xs">npm run db:seed</code> after
                    connecting Neon.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.transactionDate}</TableCell>
                    <TableCell>{tx.description ?? "—"}</TableCell>
                    <TableCell>{tx.account?.name ?? "—"}</TableCell>
                    <TableCell>{tx.category?.name ?? "—"}</TableCell>
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
  );
}

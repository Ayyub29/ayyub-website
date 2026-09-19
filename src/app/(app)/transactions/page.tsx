import { getDb } from "@/db";
import { formatMoney } from "@/lib/format";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { TransactionForm } from "@/components/transaction-form";
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

export default async function TransactionsPage() {
  const today = new Date().toISOString().slice(0, 10);
  let categories: Array<{ id: string; name: string; kind: "income" | "expense" }> =
    [];
  let rows;

  try {
    const db = getDb();
    [categories, rows] = await Promise.all([
      db.query.categories.findMany({
        columns: { id: true, name: true, kind: true },
        orderBy: (cat, { asc }) => [asc(cat.kind), asc(cat.name)],
      }),
      db.query.transactions.findMany({
        orderBy: (transactions, { desc: d }) => [
          d(transactions.transactionDate),
          d(transactions.createdAt),
        ],
        with: { category: true },
      }),
    ]);
  } catch {
    categories = [];
    rows = [] as NonNullable<typeof rows>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Log daily spending and income — name, value, currency, date, and
          category.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add transaction</CardTitle>
          <CardDescription>
            Values are stored as positive amounts; category type drives income vs
            expense in summaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create at least one category before adding transactions.
            </p>
          ) : (
            <TransactionForm categories={categories} defaultDate={today} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All transactions</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.transactionDate}</TableCell>
                    <TableCell>{tx.name}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="secondary">
                          {tx.category.name} ({tx.category.kind})
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell>
                      <DeleteTransactionButton id={tx.id} />
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

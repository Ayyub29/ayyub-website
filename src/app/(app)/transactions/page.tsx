import { getDb } from "@/db";
import { getDisplayMoney } from "@/lib/currency/server-display";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
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
  let money;

  try {
    const db = getDb();
    money = await getDisplayMoney();
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
    money = null;
  }

  const displayCurrency = money?.displayCurrency ?? "IDR";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Log daily spending and income. List shows amounts converted to{" "}
          {displayCurrency} (toggle in the header).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add transaction</CardTitle>
          <CardDescription>
            Store the original currency per row; summaries use live exchange
            rates for conversion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create categories in Settings → Categories first.
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
                <TableHead className="text-right">{displayCurrency}</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
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
                      {money?.formatConverted(tx.amount, tx.currency) ?? tx.amount}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tx.amount} {tx.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {tx.categoryId ? (
                          <TransactionEditSheet
                            categories={categories}
                            transaction={{
                              id: tx.id,
                              name: tx.name,
                              amount: tx.amount,
                              currency: tx.currency,
                              transactionDate: tx.transactionDate,
                              categoryId: tx.categoryId,
                            }}
                          />
                        ) : null}
                        <DeleteTransactionButton id={tx.id} />
                      </div>
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

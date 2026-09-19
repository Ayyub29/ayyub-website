import { getDb } from "@/db";
import { getDisplayMoney } from "@/lib/currency/server-display";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { TransactionEditSheet } from "@/components/transaction-edit-sheet";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionListToolbar } from "@/components/transaction-list-toolbar";
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
import { parseTransactionLogQuery } from "@/lib/list-query/transaction-log";
import { listMoneyTransactions } from "@/lib/money/list-transactions";

export const dynamic = "force-dynamic";

type TransactionsPageProps = {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const listQuery = parseTransactionLogQuery(params);
  const today = new Date().toISOString().slice(0, 10);
  let categories: Array<{ id: string; name: string; kind: "income" | "expense" }> =
    [];
  let rows;
  let money;
  let totalCount = 0;
  let page = listQuery.page;

  try {
    const db = getDb();
    money = await getDisplayMoney();
    const [cats, listResult] = await Promise.all([
      db.query.categories.findMany({
        columns: { id: true, name: true, kind: true },
        orderBy: (cat, { asc }) => [asc(cat.kind), asc(cat.name)],
      }),
      listMoneyTransactions(listQuery),
    ]);
    categories = cats;
    rows = listResult.rows;
    totalCount = listResult.totalCount;
    page = listResult.page;
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
          Log daily spending and income. List shows the last three months by
          default (amounts converted to {displayCurrency}; toggle in the header).
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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Newest first within the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionListToolbar
            basePath="/transactions"
            query={listQuery}
            totalCount={totalCount}
            page={page}
          />
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
                    No transactions in this range. Widen the dates above or add a
                    new entry.
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

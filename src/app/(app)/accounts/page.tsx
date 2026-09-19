import { getDb } from "@/db";
import { formatMoney } from "@/lib/format";
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

export default async function AccountsPage() {
  let accounts: Awaited<
    ReturnType<ReturnType<typeof getDb>["query"]["accounts"]["findMany"]>
  > = [];

  try {
    const db = getDb();
    accounts = await db.query.accounts.findMany({
      orderBy: (accountsTable, { asc }) => [asc(accountsTable.name)],
    });
  } catch {
    accounts = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Wallets and balances referenced by transactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your accounts</CardTitle>
          <CardDescription>Initial balance is the starting point before transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Initial balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No accounts yet.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.type}</Badge>
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(account.initialBalance, account.currency)}
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

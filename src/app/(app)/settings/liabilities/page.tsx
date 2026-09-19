import { getDb } from "@/db";
import { DeleteLiabilityButton } from "@/components/delete-liability-button";
import { LiabilityCreateForm } from "@/components/liability-create-form";
import { LiabilityEditSheet } from "@/components/liability-edit-sheet";
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

export default async function SettingsLiabilitiesPage() {
  let liabilities: Awaited<
    ReturnType<
      ReturnType<typeof getDb>["query"]["financialLiabilities"]["findMany"]
    >
  > = [];

  try {
    const db = getDb();
    liabilities = await db.query.financialLiabilities.findMany({
      orderBy: (row, { asc }) => [asc(row.sortOrder), asc(row.name)],
    });
  } catch {
    liabilities = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Liabilities</h2>
        <p className="text-sm text-muted-foreground">
          Outstanding balances and annual payments for debt ratios on the
          financial statement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add liability</CardTitle>
        </CardHeader>
        <CardContent>
          <LiabilityCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your liabilities</CardTitle>
          <CardDescription>
            Mark mortgage separately for non-mortgage repayment ratio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Annual payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liabilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No liabilities yet
                  </TableCell>
                </TableRow>
              ) : (
                liabilities.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      {row.kind === "mortgage" ? "Mortgage" : "Other"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.balance} {row.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.annualPayment} {row.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <LiabilityEditSheet liability={row} />
                        <DeleteLiabilityButton id={row.id} />
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

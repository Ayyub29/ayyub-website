import { getDb } from "@/db";
import { DEFAULT_CATEGORIES } from "@/lib/categories/defaults";
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

export default async function CategoriesPage() {
  let categories: Awaited<
    ReturnType<ReturnType<typeof getDb>["query"]["categories"]["findMany"]>
  > = [];

  try {
    const db = getDb();
    categories = await db.query.categories.findMany({
      orderBy: (categoriesTable, { asc }) => [
        asc(categoriesTable.kind),
        asc(categoriesTable.sortOrder),
        asc(categoriesTable.name),
      ],
    });
  } catch {
    categories = [];
  }

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Fixed list for personal money management. Sync from code with{" "}
          <code className="text-xs">npm run db:seed:categories</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expected categories</CardTitle>
          <CardDescription>
            {DEFAULT_CATEGORIES.length} total — 2 income, 13 expense (expense
            includes a separate &quot;Others&quot; from income Others).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CategorySection title="Income" rows={income} />
          <CategorySection title="Expense" rows={expense} />
        </CardContent>
      </Card>
    </div>
  );
}

function CategorySection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    name: string;
    kind: "income" | "expense";
    defaultMonthlyBudget: string | null;
  }>;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Default budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                None in database — run{" "}
                <code className="text-xs">npm run db:seed:categories</code>.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{category.kind}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {category.kind === "expense" && category.defaultMonthlyBudget
                    ? formatMoney(category.defaultMonthlyBudget, "IDR")
                    : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

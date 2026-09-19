import { getDb } from "@/db";
import { formatMoney } from "@/lib/format";
import { CategoryForm } from "@/components/category-form";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Labels for transactions. Expense categories can have a default monthly
          budget.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category list</CardTitle>
          <CardDescription>Used when logging transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Default budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {category.kind === "expense" && category.defaultMonthlyBudget
                        ? formatMoney(category.defaultMonthlyBudget)
                        : "—"}
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

import { getDb } from "@/db";
import { getDisplayMoney } from "@/lib/currency/server-display";
import { CategoryCreateForm } from "@/components/category-create-form";
import { CategoryEditSheet } from "@/components/category-edit-sheet";
import { DeleteCategoryButton } from "@/components/delete-category-button";
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

export default async function SettingsCategoriesPage() {
  let money;
  let categories: Awaited<
    ReturnType<ReturnType<typeof getDb>["query"]["categories"]["findMany"]>
  > = [];

  try {
    const db = getDb();
    money = await getDisplayMoney();
    categories = await db.query.categories.findMany({
      orderBy: (categoriesTable, { asc }) => [
        asc(categoriesTable.kind),
        asc(categoriesTable.sortOrder),
        asc(categoriesTable.name),
      ],
    });
  } catch {
    categories = [];
    money = null;
  }

  const displayCurrency = money?.displayCurrency ?? "IDR";

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Create, edit, or remove categories. Budget amounts use your display
          currency ({displayCurrency}). Optional:{" "}
          <code className="text-xs">npm run db:seed:categories</code> for the
          starter list.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All categories</CardTitle>
          <CardDescription>
            {categories.length} total ({income.length} income, {expense.length}{" "}
            expense)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <CategoryTable
            title="Income"
            rows={income}
            displayCurrency={displayCurrency}
            formatBudget={(amount, budgetCurrency) =>
              money?.formatConverted(amount, budgetCurrency ?? "IDR") ?? amount
            }
          />
          <CategoryTable
            title="Expense"
            rows={expense}
            displayCurrency={displayCurrency}
            formatBudget={(amount, budgetCurrency) =>
              money?.formatConverted(amount, budgetCurrency ?? "IDR") ?? amount
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryTable({
  title,
  rows,
  displayCurrency,
  formatBudget,
}: {
  title: string;
  displayCurrency: string;
  formatBudget: (amount: string, budgetCurrency: string | null) => string;
  rows: Array<{
    id: string;
    name: string;
    kind: "income" | "expense";
    color: string | null;
    defaultMonthlyBudget: string | null;
    budgetCurrency: string | null;
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
            <TableHead className="text-right">
              Budget ({displayCurrency})
            </TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No {title.toLowerCase()} categories yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span
                      className="size-3 rounded-full border"
                      style={{ backgroundColor: category.color ?? "#64748b" }}
                    />
                    {category.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{category.kind}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {category.kind === "expense" && category.defaultMonthlyBudget
                    ? formatBudget(
                        category.defaultMonthlyBudget,
                        category.budgetCurrency,
                      )
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <CategoryEditSheet category={category} />
                    <DeleteCategoryButton id={category.id} name={category.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

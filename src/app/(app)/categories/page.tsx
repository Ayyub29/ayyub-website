import { getDb } from "@/db";
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
          Income and expense labels for budgeting and reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category list</CardTitle>
          <CardDescription>Map these to your spreadsheet columns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Color</TableHead>
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
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-2"
                        style={{ color: category.color ?? undefined }}
                      >
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: category.color ?? "#64748b" }}
                        />
                        {category.color}
                      </span>
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

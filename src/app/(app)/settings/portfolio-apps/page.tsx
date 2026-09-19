import { getDb } from "@/db";
import { DeletePortfolioApplicationButton } from "@/components/delete-portfolio-application-button";
import { PortfolioApplicationCreateForm } from "@/components/portfolio-application-create-form";
import { PortfolioApplicationEditSheet } from "@/components/portfolio-application-edit-sheet";
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

export default async function SettingsPortfolioAppsPage() {
  let applications: Awaited<
    ReturnType<
      ReturnType<typeof getDb>["query"]["portfolioApplications"]["findMany"]
    >
  > = [];

  try {
    const db = getDb();
    applications = await db.query.portfolioApplications.findMany({
      orderBy: (app, { asc }) => [asc(app.sortOrder), asc(app.name)],
    });
  } catch {
    applications = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Portfolio applications
        </h2>
        <p className="text-sm text-muted-foreground">
          Brokers and platforms where you log deposits, buys, and sells (Ajaib,
          Bibit, IBKR, etc.). Optional:{" "}
          <code className="text-xs">npm run db:seed:portfolio</code> for the
          default list.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add application</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioApplicationCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your applications</CardTitle>
          <CardDescription>
            Lower sort order appears first in dropdowns. Delete is blocked while
            transactions reference an app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Sort</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No applications yet. Add one above or run the seed script.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="text-right">{app.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PortfolioApplicationEditSheet application={app} />
                        <DeletePortfolioApplicationButton id={app.id} />
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

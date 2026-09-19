import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinanceHealthThresholdsForm } from "@/components/finance-health-thresholds-form";
import { getFinanceHealthThresholds } from "@/lib/finance/health-thresholds";

export const dynamic = "force-dynamic";

export default async function SettingsFinanceHealthPage() {
  let thresholds;
  try {
    thresholds = await getFinanceHealthThresholds();
  } catch {
    thresholds = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Finance health thresholds
        </h2>
        <p className="text-sm text-muted-foreground">
          Targets for liquidity, saving, debt, and solvability ratios on the
          financial statement. Percent fields use whole numbers (e.g. 15 for 15%).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indicator targets</CardTitle>
          <CardDescription>
            Defaults follow common personal finance guidelines; adjust to your
            plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thresholds ? (
            <FinanceHealthThresholdsForm thresholds={thresholds} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your database first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

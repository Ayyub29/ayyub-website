import { MonthNav } from "@/components/month-nav";
import {
  SummaryViewToggle,
  type SummaryView,
} from "@/components/summary-view-toggle";
import { YearNav } from "@/components/year-nav";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDisplayMoney } from "@/lib/currency/server-display";
import { formatMonthYear } from "@/lib/format";
import { getMonthlySummary, parseYearMonth } from "@/lib/money/monthly";
import { getYearlySummary, parseYear } from "@/lib/money/yearly";

import { DashboardMonthlyView } from "./dashboard-monthly-view";
import { DashboardYearlyView } from "./dashboard-yearly-view";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ view?: string; year?: string; month?: string }>;
};

function parseSummaryView(value?: string): SummaryView {
  return value === "yearly" ? "yearly" : "monthly";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const view = parseSummaryView(params.view);
  const { year, month } = parseYearMonth(params.year, params.month);
  const { year: yearOnly } = parseYear(params.year);

  let money;
  let setupRequired = false;

  try {
    money = await getDisplayMoney();
  } catch {
    setupRequired = true;
  }

  if (setupRequired || !money) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
        <Card>
          <CardHeader>
            <CardTitle>Connect your database</CardTitle>
            <CardDescription>
              Set <code className="text-xs">DATABASE_URL</code>, run{" "}
              <code className="text-xs">npm run db:push</code>, then add categories
              and transactions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { displayCurrency } = money;

  if (view === "yearly") {
    let yearlySummary;
    try {
      yearlySummary = await getYearlySummary(yearOnly, {
        displayCurrency: money.displayCurrency,
        rates: money.rates,
      });
    } catch {
      setupRequired = true;
    }

    if (setupRequired || !yearlySummary) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
          <Card>
            <CardHeader>
              <CardTitle>Could not load yearly summary</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <SummaryViewToggle view={view} year={yearOnly} month={month} />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
                <p className="text-sm text-muted-foreground">
                  {yearOnly} · all amounts in {displayCurrency}
                </p>
              </div>
            </div>
            <YearNav year={yearOnly} />
          </div>
        </div>

        <DashboardYearlyView
          year={yearOnly}
          summary={yearlySummary}
          money={money}
        />
      </div>
    );
  }

  let monthlySummary;
  try {
    monthlySummary = await getMonthlySummary(year, month, {
      displayCurrency: money.displayCurrency,
      rates: money.rates,
    });
  } catch {
    setupRequired = true;
  }

  if (setupRequired || !monthlySummary) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
        <Card>
          <CardHeader>
            <CardTitle>Could not load monthly summary</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <SummaryViewToggle view={view} year={year} month={month} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Summary</h1>
              <p className="text-sm text-muted-foreground">
                {formatMonthYear(year, month)} · all amounts in {displayCurrency}
              </p>
            </div>
          </div>
          <MonthNav year={year} month={month} />
        </div>
      </div>

      <DashboardMonthlyView
        year={year}
        month={month}
        summary={monthlySummary}
        money={money}
      />
    </div>
  );
}

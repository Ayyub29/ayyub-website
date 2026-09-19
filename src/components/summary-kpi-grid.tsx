import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SummaryKpiGridProps = {
  formatAmount: (amount: number) => string;
  income: number;
  expenses: number;
  expensesExcludingGoalInvestment: number;
  net: number;
  netExcludingGoalInvestment: number;
};

export function SummaryKpiGrid({
  formatAmount,
  income,
  expenses,
  expensesExcludingGoalInvestment,
  net,
  netExcludingGoalInvestment,
}: SummaryKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Income</CardDescription>
          <CardTitle className="text-2xl">{formatAmount(income)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total expenses</CardDescription>
          <CardTitle className="text-2xl">{formatAmount(expenses)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Expenses (excl. Goal & Investment)</CardDescription>
          <CardTitle className="text-2xl">
            {formatAmount(expensesExcludingGoalInvestment)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Net</CardDescription>
          <CardTitle className="text-2xl">{formatAmount(net)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Net (excl. Goal & Investment)</CardDescription>
          <CardTitle className="text-2xl">
            {formatAmount(netExcludingGoalInvestment)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

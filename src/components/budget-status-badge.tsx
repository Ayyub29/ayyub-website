import { Badge } from "@/components/ui/badge";
import type { BudgetStatus } from "@/lib/money/monthly";

const labels: Record<BudgetStatus, string> = {
  over: "Over budget",
  on_track: "On track",
  under: "Under budget",
  no_budget: "No budget",
};

const variants: Record<
  BudgetStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  over: "destructive",
  on_track: "default",
  under: "secondary",
  no_budget: "outline",
};

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

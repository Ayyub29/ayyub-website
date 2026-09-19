import { Badge } from "@/components/ui/badge";
import type { HealthStatus } from "@/lib/finance/statement";

const labels: Record<HealthStatus, string> = {
  good: "On target",
  warn: "Review",
  bad: "Below target",
  na: "N/A",
};

const variants: Record<
  HealthStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  good: "default",
  warn: "secondary",
  bad: "destructive",
  na: "outline",
};

export function HealthStatusBadge({ status }: { status: HealthStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

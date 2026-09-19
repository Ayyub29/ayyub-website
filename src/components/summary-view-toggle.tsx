import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SummaryView = "monthly" | "yearly";

type SummaryViewToggleProps = {
  view: SummaryView;
  year: number;
  month: number;
};

export function SummaryViewToggle({
  view,
  year,
  month,
}: SummaryViewToggleProps) {
  const monthlyHref = `/dashboard?view=monthly&year=${year}&month=${month}`;
  const yearlyHref = `/dashboard?view=yearly&year=${year}`;

  return (
    <div className="inline-flex rounded-lg border p-0.5">
      <Link
        href={monthlyHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "rounded-md",
          view === "monthly" && "bg-muted font-medium text-foreground",
        )}
      >
        Monthly
      </Link>
      <Link
        href={yearlyHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "rounded-md",
          view === "yearly" && "bg-muted font-medium text-foreground",
        )}
      >
        Yearly
      </Link>
    </div>
  );
}

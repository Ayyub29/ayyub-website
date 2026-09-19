import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";

type MonthNavProps = {
  year: number;
  month: number;
  /** @deprecated use dashboard month nav without basePath */
  basePath?: string;
};

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function monthHref(year: number, month: number) {
  return `/dashboard?view=monthly&year=${year}&month=${month}`;
}

export function MonthNav({ year, month }: MonthNavProps) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={monthHref(prev.year, prev.month)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Previous
      </Link>
      <span className="min-w-[10rem] text-center text-sm font-medium">
        {formatMonthYear(year, month)}
      </span>
      <Link
        href={monthHref(next.year, next.month)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Next
      </Link>
    </div>
  );
}

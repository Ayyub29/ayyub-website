import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";

type MonthNavProps = {
  year: number;
  month: number;
  basePath: string;
};

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function MonthNav({ year, month, basePath }: MonthNavProps) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`${basePath}?year=${prev.year}&month=${prev.month}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Previous
      </Link>
      <span className="min-w-[10rem] text-center text-sm font-medium">
        {formatMonthYear(year, month)}
      </span>
      <Link
        href={`${basePath}?year=${next.year}&month=${next.month}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Next
      </Link>
    </div>
  );
}

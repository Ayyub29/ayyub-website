import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearNavProps = {
  year: number;
};

function yearHref(year: number) {
  return `/dashboard?view=yearly&year=${year}`;
}

export function YearNav({ year }: YearNavProps) {
  const prev = year - 1;
  const next = year + 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={yearHref(prev)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Previous
      </Link>
      <span className="min-w-[6rem] text-center text-sm font-medium">{year}</span>
      <Link
        href={yearHref(next)}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Next
      </Link>
    </div>
  );
}

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearNavProps = {
  year: number;
  basePath: string;
};

export function YearNav({ year, basePath }: YearNavProps) {
  const prev = year - 1;
  const next = year + 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`${basePath}?year=${prev}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Previous
      </Link>
      <span className="min-w-[6rem] text-center text-sm font-medium">{year}</span>
      <Link
        href={`${basePath}?year=${next}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Next
      </Link>
    </div>
  );
}

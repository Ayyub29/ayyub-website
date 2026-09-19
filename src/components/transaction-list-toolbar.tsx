import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatTransactionLogRangeLabel,
  transactionLogHref,
  type TransactionLogQuery,
} from "@/lib/list-query/transaction-log";
import { cn } from "@/lib/utils";

type TransactionListToolbarProps = {
  basePath: string;
  query: TransactionLogQuery;
  totalCount: number;
  page: number;
};

export function TransactionListToolbar({
  basePath,
  query,
  totalCount,
  page,
}: TransactionListToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const rangeLabel = formatTransactionLogRangeLabel(
    query.from,
    query.to,
    query.isDefaultRange,
  );
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * query.pageSize + 1;
  const showingTo = Math.min(page * query.pageSize, totalCount);

  const hrefForPage = (p: number) =>
    transactionLogHref(basePath, query, p);

  return (
    <div className="mb-4 space-y-4">
      <form
        method="get"
        action={basePath}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1">
          <Label htmlFor="tx-from">From</Label>
          <Input
            id="tx-from"
            name="from"
            type="date"
            defaultValue={query.from}
            className="w-[11rem]"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tx-to">To</Label>
          <Input
            id="tx-to"
            name="to"
            type="date"
            defaultValue={query.to}
            className="w-[11rem]"
          />
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          Apply range
        </button>
        {!query.isDefaultRange ? (
          <Link
            href={basePath}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Last 3 months
          </Link>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {rangeLabel}
          {totalCount > 0
            ? ` · ${showingFrom}–${showingTo} of ${totalCount}`
            : " · No entries in range"}
        </span>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={hrefForPage(page - 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Previous
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "pointer-events-none opacity-50",
                )}
              >
                Previous
              </span>
            )}
            <span className="min-w-[6rem] text-center text-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={hrefForPage(page + 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Next
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "pointer-events-none opacity-50",
                )}
              >
                Next
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

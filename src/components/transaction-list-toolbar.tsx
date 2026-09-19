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
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      >
        <div className="space-y-1">
          <Label htmlFor="tx-from">From</Label>
          <Input
            id="tx-from"
            name="from"
            type="date"
            defaultValue={query.from}
            className="w-full min-w-0 sm:w-[11rem]"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tx-to">To</Label>
          <Input
            id="tx-to"
            name="to"
            type="date"
            defaultValue={query.to}
            className="w-full min-w-0 sm:w-[11rem]"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:contents">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "w-full sm:w-auto",
            )}
          >
            Apply range
          </button>
          {!query.isDefaultRange ? (
            <Link
              href={basePath}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full text-center sm:w-auto",
              )}
            >
              Last 3 months
            </Link>
          ) : null}
        </div>
      </form>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
        <span className="min-w-0 break-words">
          {rangeLabel}
          {totalCount > 0
            ? ` · ${showingFrom}–${showingTo} of ${totalCount}`
            : " · No entries in range"}
        </span>
        {totalPages > 1 ? (
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
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

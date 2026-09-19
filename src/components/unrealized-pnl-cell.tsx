import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

type UnrealizedPnlCellProps = {
  pnl: number | null;
  costBasis?: number;
  formatDisplay: (amount: number) => string;
  className?: string;
};

export function UnrealizedPnlCell({
  pnl,
  costBasis,
  formatDisplay,
  className,
}: UnrealizedPnlCellProps) {
  if (pnl == null) {
    return (
      <span className={cn("text-muted-foreground", className)} title="No live price">
        —
      </span>
    );
  }

  const positive = pnl >= 0;
  const ratio =
    costBasis != null && costBasis > 0 ? pnl / costBasis : null;

  return (
    <div className={cn("text-right", className)}>
      <div
        className={cn(
          "font-medium tabular-nums",
          positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400",
        )}
      >
        {positive ? "+" : ""}
        {formatDisplay(pnl)}
      </div>
      {ratio != null ? (
        <div
          className={cn(
            "text-xs tabular-nums",
            positive
              ? "text-emerald-600/80 dark:text-emerald-400/80"
              : "text-red-600/80 dark:text-red-400/80",
          )}
        >
          {positive ? "+" : ""}
          {formatPercent(ratio)}
        </div>
      ) : null}
    </div>
  );
}

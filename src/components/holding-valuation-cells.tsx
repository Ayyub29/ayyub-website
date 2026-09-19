import { TableCell } from "@/components/ui/table";
import type { ValuedHoldingRow } from "@/lib/portfolio/quotes";

type HoldingValuationCellsProps = {
  row: ValuedHoldingRow;
  formatDisplay: (amount: number) => string;
  formatMoney: (amount: number, currency: string) => string;
};

export function HoldingValuationCells({
  row,
  formatDisplay,
  formatMoney,
}: HoldingValuationCellsProps) {
  const { valuation } = row;

  if (valuation.unitPrice == null || valuation.unitPriceCurrency == null) {
    return (
      <>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
        <TableCell className="text-right text-muted-foreground">—</TableCell>
      </>
    );
  }

  return (
    <>
      <TableCell className="text-right whitespace-nowrap">
        {formatMoney(valuation.unitPrice, valuation.unitPriceCurrency)}
        <div className="text-xs text-muted-foreground">
          / {valuation.unitLabel}
          {row.category === "stock"
            ? ` · ${valuation.unitMultiplier} shares/lot`
            : null}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {valuation.currentAmountDisplay != null
          ? formatDisplay(valuation.currentAmountDisplay)
          : "—"}
      </TableCell>
    </>
  );
}

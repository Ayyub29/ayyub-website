import type { ValuedHoldingRow } from "./quotes";

/** Market value minus cost basis in display currency, or null if no live quote. */
export function holdingUnrealizedPnlDisplay(
  row: ValuedHoldingRow,
): number | null {
  const current = row.valuation.currentAmountDisplay;
  if (current == null) {
    return null;
  }
  return current - row.netInvestedDisplay;
}

export function sumNetInvestedDisplay(holdings: ValuedHoldingRow[]): number {
  return holdings.reduce((sum, row) => sum + row.netInvestedDisplay, 0);
}

/** Sum of cost basis for holdings that have a live market value. */
export function sumPricedCostBasisDisplay(holdings: ValuedHoldingRow[]): number {
  return holdings.reduce((sum, row) => {
    if (row.valuation.currentAmountDisplay == null) {
      return sum;
    }
    return sum + row.netInvestedDisplay;
  }, 0);
}

export function sumUnrealizedPnlDisplay(holdings: ValuedHoldingRow[]): number {
  return holdings.reduce((sum, row) => {
    const pnl = holdingUnrealizedPnlDisplay(row);
    return sum + (pnl ?? 0);
  }, 0);
}

export function unrealizedReturnRatio(
  pnl: number,
  pricedCostBasis: number,
): number | null {
  if (pricedCostBasis <= 0) {
    return null;
  }
  return pnl / pricedCostBasis;
}

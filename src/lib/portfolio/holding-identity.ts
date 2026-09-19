import type { PortfolioCategory } from "./constants";

/** Minimum open units to count as a position (avoids float dust). */
export const OPEN_QUANTITY_EPS = 1e-6;

/** Canonical name for matching buys/sells and displaying holdings. */
export function normalizeHoldingName(
  name: string,
  category: PortfolioCategory,
): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return trimmed;
  }
  if (category === "stock") {
    return trimmed.toUpperCase();
  }
  if (category === "crypto") {
    const upper = trimmed.toUpperCase();
    if (upper === "BITCOIN" || upper === "BTC" || upper.startsWith("BTC")) {
      return "BTC";
    }
  }
  return trimmed;
}

export function holdingPositionKey(
  applicationId: string,
  category: PortfolioCategory,
  name: string,
): string {
  return `${applicationId}|${category}|${normalizeHoldingName(name, category).toLowerCase()}`;
}

export function holdingQuoteKey(
  category: PortfolioCategory,
  name: string,
): string {
  return `${category}|${normalizeHoldingName(name, category).toLowerCase()}`;
}

/** Open when buy units exceed sell units (fully sold positions are closed). */
export function isOpenPosition(
  totalBuyUnits: number,
  totalSellUnits: number,
): boolean {
  return totalBuyUnits - totalSellUnits > OPEN_QUANTITY_EPS;
}

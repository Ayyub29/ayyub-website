export const PORTFOLIO_TX_TYPES = [
  "deposit",
  "draw",
  "buy",
  "sell",
] as const;

export type PortfolioTxType = (typeof PORTFOLIO_TX_TYPES)[number];

export const PORTFOLIO_CATEGORIES = [
  "stock",
  "p2p",
  "obligasi",
  "crypto",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_TX_TYPE_LABELS: Record<PortfolioTxType, string> = {
  deposit: "Account deposit",
  draw: "Draw",
  buy: "Buy",
  sell: "Sell",
};

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  stock: "Stock",
  p2p: "P2P",
  obligasi: "Obligasi / SBN",
  crypto: "Crypto",
};

export const DEFAULT_PORTFOLIO_APPLICATIONS = [
  { name: "Ajaib", sortOrder: 1 },
  { name: "ALAMI", sortOrder: 2 },
  { name: "Bibit", sortOrder: 3 },
  { name: "Ajaib Alpha", sortOrder: 4 },
  { name: "IBKR", sortOrder: 5 },
] as const;

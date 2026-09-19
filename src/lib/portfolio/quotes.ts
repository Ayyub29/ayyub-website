import type { SupportedCurrency } from "@/lib/currencies";
import {
  convertWithMatrix,
  type ExchangeRateMatrix,
} from "@/lib/currency/google-rates";

import type { PortfolioCategory } from "./constants";
import type { HoldingRow, PortfolioSummary } from "./summary";

/** IDX board lot size (1 lot = 100 shares). */
export const IDX_SHARES_PER_LOT = 100;

export type HoldingValuation = {
  unitPrice: number | null;
  unitPriceCurrency: string | null;
  unitLabel: string;
  /** Multiplier applied to logged units (lots → shares for IDX). */
  unitMultiplier: number;
  currentAmount: number | null;
  currentAmountDisplay: number | null;
  quoteSource: "yahoo" | "coingecko" | null;
};

export type ValuedHoldingRow = HoldingRow & { valuation: HoldingValuation };

export type ValuedApplicationSummary = Omit<
  import("./summary").ApplicationSummary,
  "holdings"
> & { holdings: ValuedHoldingRow[] };

export type ValuedCategorySummary = Omit<
  import("./summary").CategorySummary,
  "holdings"
> & { holdings: ValuedHoldingRow[] };

export type ValuedPortfolioSummary = Omit<PortfolioSummary, "holdings" | "byApplication" | "byCategory"> & {
  holdings: ValuedHoldingRow[];
  byApplication: ValuedApplicationSummary[];
  byCategory: ValuedCategorySummary[];
};

type PriceQuote = {
  price: number;
  currency: string;
  source: "yahoo" | "coingecko";
};

type CacheEntry = {
  fetchedAt: number;
  quote: PriceQuote;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const quoteCache = new Map<string, CacheEntry>();

const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; AyyubPortfolio/1.0; +https://github.com/Ayyub29/ayyub-website)";

function cacheKey(source: string, symbol: string) {
  return `${source}:${symbol}`;
}

function getCached(key: string): PriceQuote | null {
  const entry = quoteCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    quoteCache.delete(key);
    return null;
  }
  return entry.quote;
}

function setCached(key: string, quote: PriceQuote) {
  quoteCache.set(key, { fetchedAt: Date.now(), quote });
}

function normalizeIdxTicker(name: string) {
  const clean = name.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) {
    return null;
  }
  if (clean.endsWith(".JK")) {
    return clean;
  }
  if (!/^[A-Z0-9]{2,6}$/.test(clean)) {
    return null;
  }
  return `${clean}.JK`;
}

function isBitcoinHolding(name: string) {
  const normalized = name.trim().toUpperCase();
  return (
    normalized === "BTC" ||
    normalized === "BITCOIN" ||
    normalized.startsWith("BTC ")
  );
}

async function fetchYahooQuote(ticker: string): Promise<PriceQuote | null> {
  const key = cacheKey("yahoo", ticker);
  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "1d");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": YAHOO_USER_AGENT },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          currency?: string;
        };
      }>;
    };
  };

  const meta = payload.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const currency = meta?.currency;

  if (price == null || !currency || price <= 0) {
    return null;
  }

  const quote: PriceQuote = {
    price,
    currency,
    source: "yahoo",
  };
  setCached(key, quote);
  return quote;
}

async function fetchBitcoinQuote(): Promise<PriceQuote | null> {
  const key = cacheKey("coingecko", "bitcoin");
  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,idr";

  const response = await fetch(url, {
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    bitcoin?: { usd?: number; idr?: number };
  };

  const usd = payload.bitcoin?.usd;
  if (usd == null || usd <= 0) {
    return null;
  }

  const quote: PriceQuote = {
    price: usd,
    currency: "USD",
    source: "coingecko",
  };
  setCached(key, quote);
  return quote;
}

function toDisplay(
  amount: number,
  from: string,
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
) {
  const fromCurrency = (
    from.length === 3 ? from : displayCurrency
  ) as SupportedCurrency;
  return convertWithMatrix(amount, fromCurrency, displayCurrency, rates);
}

function buildValuation(
  holding: HoldingRow,
  quote: PriceQuote | null,
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
): HoldingValuation {
  const empty: HoldingValuation = {
    unitPrice: null,
    unitPriceCurrency: null,
    unitLabel: "unit",
    unitMultiplier: 1,
    currentAmount: null,
    currentAmountDisplay: null,
    quoteSource: null,
  };

  if (!quote) {
    if (holding.category === "stock") {
      return {
        ...empty,
        unitLabel: "share",
        unitMultiplier: IDX_SHARES_PER_LOT,
      };
    }
    return empty;
  }

  if (holding.category === "stock") {
    const shares = holding.quantity * IDX_SHARES_PER_LOT;
    const currentAmount = shares * quote.price;
    return {
      unitPrice: quote.price,
      unitPriceCurrency: quote.currency,
      unitLabel: "share",
      unitMultiplier: IDX_SHARES_PER_LOT,
      currentAmount,
      currentAmountDisplay: toDisplay(
        currentAmount,
        quote.currency,
        displayCurrency,
        rates,
      ),
      quoteSource: quote.source,
    };
  }

  if (holding.category === "crypto") {
    const currentAmount = holding.quantity * quote.price;
    return {
      unitPrice: quote.price,
      unitPriceCurrency: quote.currency,
      unitLabel: "coin",
      unitMultiplier: 1,
      currentAmount,
      currentAmountDisplay: toDisplay(
        currentAmount,
        quote.currency,
        displayCurrency,
        rates,
      ),
      quoteSource: quote.source,
    };
  }

  return empty;
}

async function quoteForHolding(
  holding: HoldingRow,
): Promise<PriceQuote | null> {
  if (holding.category === "stock") {
    const ticker = normalizeIdxTicker(holding.name);
    if (!ticker) {
      return null;
    }
    return fetchYahooQuote(ticker);
  }

  if (holding.category === "crypto" && isBitcoinHolding(holding.name)) {
    return fetchBitcoinQuote();
  }

  return null;
}

export async function enrichPortfolioSummaryWithQuotes(
  summary: PortfolioSummary,
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
): Promise<ValuedPortfolioSummary> {
  const uniqueKeys = new Set<string>();
  const holdingsToQuote: HoldingRow[] = [];

  for (const row of summary.holdings) {
    const key = `${row.category}|${row.name.toLowerCase()}`;
    if (uniqueKeys.has(key)) {
      continue;
    }
    uniqueKeys.add(key);
    if (row.category === "stock" || row.category === "crypto") {
      holdingsToQuote.push(row);
    }
  }

  const quoteByKey = new Map<string, PriceQuote | null>();
  await Promise.all(
    holdingsToQuote.map(async (holding) => {
      const key = `${holding.category}|${holding.name.toLowerCase()}`;
      const quote = await quoteForHolding(holding);
      quoteByKey.set(key, quote);
    }),
  );

  const attachValuation = (row: HoldingRow): ValuedHoldingRow => {
    const key = `${row.category}|${row.name.toLowerCase()}`;
    const quote = quoteByKey.get(key) ?? null;
    return {
      ...row,
      valuation: buildValuation(row, quote, displayCurrency, rates),
    };
  };

  const holdings = summary.holdings.map(attachValuation);

  return {
    ...summary,
    holdings,
    byApplication: summary.byApplication.map((app) => ({
      ...app,
      holdings: app.holdings.map(attachValuation),
    })),
    byCategory: summary.byCategory.map((group) => ({
      ...group,
      holdings: group.holdings.map(attachValuation),
    })),
  };
}

export function sumCurrentAmountDisplay(holdings: ValuedHoldingRow[]) {
  return holdings.reduce(
    (sum, row) => sum + (row.valuation.currentAmountDisplay ?? 0),
    0,
  );
}

import type { SupportedCurrency } from "@/lib/currencies";
import {
  convertWithMatrix,
  type ExchangeRateMatrix,
} from "@/lib/currency/google-rates";

import type { PortfolioCategory } from "./constants";
import { IDX_SHARES_PER_LOT } from "./quotes";
import type { ValuedHoldingRow, ValuedPortfolioSummary } from "./quotes";

const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; AyyubPortfolio/1.0; +https://github.com/Ayyub29/ayyub-website)";

const CACHE_TTL_MS = 15 * 60 * 1000;

type TtmDividendQuote = {
  ttmPerShare: number;
  currency: string;
};

type CacheEntry = {
  fetchedAt: number;
  quote: TtmDividendQuote;
};

const dividendCache = new Map<string, CacheEntry>();

export type ManualDividendRow = {
  applicationId: string;
  category: PortfolioCategory;
  name: string;
  annualAmount: string;
  currency: string;
};

export type DividendProjectionSource = "yahoo" | "manual" | "unset";

export type DividendProjectionRow = {
  applicationId: string;
  applicationName: string;
  category: PortfolioCategory;
  name: string;
  annualDisplay: number;
  monthlyDisplay: number;
  source: DividendProjectionSource;
  detail: string | null;
};

export type DividendProjection = {
  rows: DividendProjectionRow[];
  totalAnnualDisplay: number;
  totalMonthlyDisplay: number;
};

function positionKey(
  applicationId: string,
  category: PortfolioCategory,
  name: string,
) {
  return `${applicationId}|${category}|${name.toLowerCase()}`;
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

function getCachedDividend(ticker: string): TtmDividendQuote | null {
  const entry = dividendCache.get(ticker);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    dividendCache.delete(ticker);
    return null;
  }
  return entry.quote;
}

function setCachedDividend(ticker: string, quote: TtmDividendQuote) {
  dividendCache.set(ticker, { fetchedAt: Date.now(), quote });
}

async function fetchYahooTtmDividendPerShare(
  ticker: string,
): Promise<TtmDividendQuote | null> {
  const cached = getCachedDividend(ticker);
  if (cached) {
    return cached;
  }

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "2y");
  url.searchParams.set("events", "div");

  try {
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
          meta?: { currency?: string };
          events?: {
            dividends?: Record<
              string,
              { amount: number; date: number }
            >;
          };
        }>;
      };
    };

    const result = payload.chart?.result?.[0];
    const currency = result?.meta?.currency;
    const dividends = result?.events?.dividends;

    if (!currency || !dividends) {
      return null;
    }

    const cutoffSec = Date.now() / 1000 - 365 * 24 * 60 * 60;
    let ttmPerShare = 0;

    for (const entry of Object.values(dividends)) {
      const when = entry.date ?? 0;
      if (when >= cutoffSec) {
        ttmPerShare += entry.amount;
      }
    }

    if (ttmPerShare <= 0) {
      return null;
    }

    const quote = { ttmPerShare, currency };
    setCachedDividend(ticker, quote);
    return quote;
  } catch {
    return null;
  }
}

export async function buildDividendProjection(
  summary: ValuedPortfolioSummary,
  manualRows: ManualDividendRow[],
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
): Promise<DividendProjection> {
  const manualByKey = new Map<string, ManualDividendRow>();
  for (const row of manualRows) {
    manualByKey.set(
      positionKey(row.applicationId, row.category, row.name),
      row,
    );
  }

  const quoteKeyToTicker = new Map<string, string>();
  for (const holding of summary.holdings) {
    if (holding.category !== "stock") {
      continue;
    }
    const ticker = normalizeIdxTicker(holding.name);
    if (ticker) {
      quoteKeyToTicker.set(
        `${holding.category}|${holding.name.toLowerCase()}`,
        ticker,
      );
    }
  }

  const tickerToTtm = new Map<string, TtmDividendQuote | null>();
  await Promise.all(
    [...new Set(quoteKeyToTicker.values())].map(async (ticker) => {
      tickerToTtm.set(ticker, await fetchYahooTtmDividendPerShare(ticker));
    }),
  );

  const ttmByQuoteKey = new Map<string, TtmDividendQuote | null>();
  for (const [quoteKey, ticker] of quoteKeyToTicker) {
    ttmByQuoteKey.set(quoteKey, tickerToTtm.get(ticker) ?? null);
  }

  const rows: DividendProjectionRow[] = [];

  for (const holding of summary.holdings) {
    const key = positionKey(
      holding.applicationId,
      holding.category,
      holding.name,
    );
    const quoteKey = `${holding.category}|${holding.name.toLowerCase()}`;

    if (holding.category === "stock") {
      const ttm = ttmByQuoteKey.get(quoteKey);
      if (ttm) {
        const shares = holding.quantity * IDX_SHARES_PER_LOT;
        const annualNative = shares * ttm.ttmPerShare;
        const annualDisplay = toDisplay(
          annualNative,
          ttm.currency,
          displayCurrency,
          rates,
        );
        rows.push({
          applicationId: holding.applicationId,
          applicationName: holding.applicationName,
          category: holding.category,
          name: holding.name,
          annualDisplay,
          monthlyDisplay: annualDisplay / 12,
          source: "yahoo",
          detail: `${ttm.currency} ${formatPerShare(ttm.ttmPerShare)}/share TTM · ${formatQuantity(shares)} shares`,
        });
      } else {
        rows.push({
          applicationId: holding.applicationId,
          applicationName: holding.applicationName,
          category: holding.category,
          name: holding.name,
          annualDisplay: 0,
          monthlyDisplay: 0,
          source: "unset",
          detail: "No TTM dividend data from Yahoo for this ticker",
        });
      }
      continue;
    }

    const manual = manualByKey.get(key);
    if (manual) {
      const annualDisplay = toDisplay(
        Number(manual.annualAmount),
        manual.currency,
        displayCurrency,
        rates,
      );
      rows.push({
        applicationId: holding.applicationId,
        applicationName: holding.applicationName,
        category: holding.category,
        name: holding.name,
        annualDisplay,
        monthlyDisplay: annualDisplay / 12,
        source: "manual",
        detail: `${manual.annualAmount} ${manual.currency}/year (manual)`,
      });
    } else {
      rows.push({
        applicationId: holding.applicationId,
        applicationName: holding.applicationName,
        category: holding.category,
        name: holding.name,
        annualDisplay: 0,
        monthlyDisplay: 0,
        source: "unset",
        detail: null,
      });
    }
  }

  rows.sort((a, b) => b.annualDisplay - a.annualDisplay);

  const totalAnnualDisplay = rows.reduce((sum, row) => sum + row.annualDisplay, 0);

  return {
    rows,
    totalAnnualDisplay,
    totalMonthlyDisplay: totalAnnualDisplay / 12,
  };
}

function formatPerShare(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export type ManualDividendHoldingOption = {
  applicationId: string;
  applicationName: string;
  category: PortfolioCategory;
  name: string;
  label: string;
  hasManual: boolean;
};

export function manualDividendHoldingOptions(
  summary: ValuedPortfolioSummary,
  manualRows: ManualDividendRow[],
): ManualDividendHoldingOption[] {
  const manualKeys = new Set(
    manualRows.map((r) =>
      positionKey(r.applicationId, r.category, r.name),
    ),
  );

  return summary.holdings
    .filter((h) => h.category !== "stock")
    .map((h) => {
      const key = positionKey(h.applicationId, h.category, h.name);
      return {
        applicationId: h.applicationId,
        applicationName: h.applicationName,
        category: h.category,
        name: h.name,
        label: `${h.name} · ${h.applicationName}`,
        hasManual: manualKeys.has(key),
      };
    });
}

import { Finance } from "google-finance-quote";

import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";

export type ExchangeRateMatrix = Record<
  SupportedCurrency,
  Record<SupportedCurrency, number>
>;

type CacheEntry = {
  fetchedAt: number;
  rates: ExchangeRateMatrix;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: CacheEntry | null = null;

/** Approximate fallback if Google Finance is unavailable. */
const FALLBACK_RATES: ExchangeRateMatrix = {
  USD: { USD: 1, IDR: 16_500, THB: 34.5 },
  IDR: { USD: 1 / 16_500, IDR: 1, THB: 34.5 / 16_500 },
  THB: { USD: 1 / 34.5, IDR: 16_500 / 34.5, THB: 1 },
};

async function fetchPairRate(
  from: SupportedCurrency,
  to: SupportedCurrency,
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const finance = new Finance({ from, to });
  const quote = await finance.quote(1);

  if (!quote.success || !quote.rate || quote.rate <= 0) {
    throw new Error(`Google Finance rate unavailable for ${from}->${to}`);
  }

  return quote.rate;
}

async function buildMatrixFromGoogle(): Promise<ExchangeRateMatrix> {
  const matrix = {} as ExchangeRateMatrix;

  for (const from of SUPPORTED_CURRENCIES) {
    matrix[from] = {} as Record<SupportedCurrency, number>;
    for (const to of SUPPORTED_CURRENCIES) {
      matrix[from][to] = await fetchPairRate(from, to);
    }
  }

  return matrix;
}

export async function getGoogleExchangeRates(): Promise<{
  rates: ExchangeRateMatrix;
  source: "google" | "fallback";
  fetchedAt: Date;
}> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      rates: cache.rates,
      source: "google",
      fetchedAt: new Date(cache.fetchedAt),
    };
  }

  try {
    const rates = await buildMatrixFromGoogle();
    cache = { fetchedAt: now, rates };
    return { rates, source: "google", fetchedAt: new Date(now) };
  } catch (error) {
    console.error("Google Finance rate fetch failed, using fallback:", error);
    return {
      rates: FALLBACK_RATES,
      source: "fallback",
      fetchedAt: new Date(now),
    };
  }
}

export function convertWithMatrix(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  matrix: ExchangeRateMatrix,
): number {
  if (from === to) {
    return amount;
  }
  const rate = matrix[from]?.[to];
  if (!rate) {
    return amount;
  }
  return amount * rate;
}

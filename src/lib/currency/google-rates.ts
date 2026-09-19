import { Finance } from "google-finance-quote";

import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";

export type ExchangeRateMatrix = Record<
  SupportedCurrency,
  Record<SupportedCurrency, number>
>;

export type ExchangeRateSource = "live" | "fallback";

type CacheEntry = {
  fetchedAt: number;
  rates: ExchangeRateMatrix;
  source: ExchangeRateSource;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: CacheEntry | null = null;

/** Used when live providers are unavailable (approximate). */
const FALLBACK_RATES: ExchangeRateMatrix = {
  USD: { USD: 1, IDR: 16_500, THB: 34.5 },
  IDR: { USD: 1 / 16_500, IDR: 1, THB: 34.5 / 16_500 },
  THB: { USD: 1 / 34.5, IDR: 16_500 / 34.5, THB: 1 },
};

const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

function buildMatrixFromUsdQuotes(usdToIdr: number, usdToThb: number): ExchangeRateMatrix {
  return {
    USD: { USD: 1, IDR: usdToIdr, THB: usdToThb },
    IDR: {
      USD: 1 / usdToIdr,
      IDR: 1,
      THB: usdToThb / usdToIdr,
    },
    THB: {
      USD: 1 / usdToThb,
      IDR: usdToIdr / usdToThb,
      THB: 1,
    },
  };
}

async function fetchExchangeRateApiMatrix(): Promise<ExchangeRateMatrix | null> {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };

    if (payload.result !== "success" || !payload.rates) {
      return null;
    }

    const usdToIdr = payload.rates.IDR;
    const usdToThb = payload.rates.THB;

    if (
      usdToIdr == null ||
      usdToThb == null ||
      usdToIdr <= 0 ||
      usdToThb <= 0
    ) {
      return null;
    }

    return buildMatrixFromUsdQuotes(usdToIdr, usdToThb);
  } catch (error) {
    console.error("ExchangeRate API fetch failed:", error);
    return null;
  }
}

async function fetchGooglePairRate(
  from: SupportedCurrency,
  to: SupportedCurrency,
): Promise<number | null> {
  if (from === to) {
    return 1;
  }

  try {
    const finance = new Finance({ from, to });
    const quote = await finance.quote(1);
    if (!quote.success || !quote.rate || quote.rate <= 0) {
      return null;
    }
    return quote.rate;
  } catch {
    return null;
  }
}

async function fetchGoogleMatrix(): Promise<ExchangeRateMatrix | null> {
  const matrix = {} as ExchangeRateMatrix;
  let livePairs = 0;

  for (const from of SUPPORTED_CURRENCIES) {
    matrix[from] = {} as Record<SupportedCurrency, number>;
    for (const to of SUPPORTED_CURRENCIES) {
      const rate =
        from === to
          ? 1
          : await fetchGooglePairRate(from, to);
      if (rate != null) {
        matrix[from][to] = rate;
        if (from !== to) {
          livePairs += 1;
        }
      } else {
        matrix[from][to] = FALLBACK_RATES[from][to];
      }
    }
  }

  return livePairs > 0 ? matrix : null;
}

/** @deprecated Name kept for callers; uses ExchangeRate API first, then Google, then fallback. */
export async function getGoogleExchangeRates(): Promise<{
  rates: ExchangeRateMatrix;
  source: ExchangeRateSource;
  fetchedAt: Date;
}> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      rates: cache.rates,
      source: cache.source,
      fetchedAt: new Date(cache.fetchedAt),
    };
  }

  const fromApi = await fetchExchangeRateApiMatrix();
  if (fromApi) {
    cache = { fetchedAt: now, rates: fromApi, source: "live" };
    return { rates: fromApi, source: "live", fetchedAt: new Date(now) };
  }

  const fromGoogle = await fetchGoogleMatrix();
  if (fromGoogle) {
    cache = { fetchedAt: now, rates: fromGoogle, source: "live" };
    return { rates: fromGoogle, source: "live", fetchedAt: new Date(now) };
  }

  console.warn(
    "Live FX unavailable (ExchangeRate API and Google Finance); using fallback matrix.",
  );
  cache = { fetchedAt: now, rates: FALLBACK_RATES, source: "fallback" };
  return {
    rates: FALLBACK_RATES,
    source: "fallback",
    fetchedAt: new Date(now),
  };
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

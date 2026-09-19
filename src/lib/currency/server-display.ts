import type { SupportedCurrency } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";

import { getDisplayCurrency } from "./display-currency";
import {
  convertWithMatrix,
  getGoogleExchangeRates,
  type ExchangeRateMatrix,
} from "./google-rates";

export type DisplayMoney = {
  displayCurrency: SupportedCurrency;
  rates: ExchangeRateMatrix;
  rateSource: "live" | "fallback";
  ratesUpdatedAt: Date;
  convert: (amount: string | number, fromCurrency: string) => number;
  format: (amount: string | number, fromCurrency?: string) => string;
  formatConverted: (amount: string | number, fromCurrency: string) => string;
};

export async function getDisplayMoney(): Promise<DisplayMoney> {
  const [displayCurrency, { rates, source, fetchedAt }] = await Promise.all([
    getDisplayCurrency(),
    getGoogleExchangeRates(),
  ]);

  const convert = (amount: string | number, fromCurrency: string) => {
    const parsed = typeof amount === "string" ? Number(amount) : amount;
    const safe = Number.isNaN(parsed) ? 0 : parsed;
    const from = (fromCurrency.length === 3
      ? fromCurrency
      : displayCurrency) as SupportedCurrency;
    return convertWithMatrix(safe, from, displayCurrency, rates);
  };

  return {
    displayCurrency,
    rates,
    rateSource: source,
    ratesUpdatedAt: fetchedAt,
    convert,
    format: (amount, fromCurrency) => {
      if (!fromCurrency || fromCurrency === displayCurrency) {
        return formatMoney(amount, displayCurrency);
      }
      return formatMoney(convert(amount, fromCurrency), displayCurrency);
    },
    formatConverted: (amount, fromCurrency) =>
      formatMoney(convert(amount, fromCurrency), displayCurrency),
  };
}

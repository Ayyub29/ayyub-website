export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "IDR",
  "MYR",
  "AUD",
  "JPY",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

import { cookies } from "next/headers";

import {
  DEFAULT_CURRENCY,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currencies";

export const DISPLAY_CURRENCY_COOKIE = "display_currency";

export async function getDisplayCurrency(): Promise<SupportedCurrency> {
  const store = await cookies();
  const value = store.get(DISPLAY_CURRENCY_COOKIE)?.value;
  if (value && isSupportedCurrency(value)) {
    return value;
  }
  return DEFAULT_CURRENCY;
}

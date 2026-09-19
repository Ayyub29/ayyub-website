"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isSupportedCurrency } from "@/lib/currencies";
import { DISPLAY_CURRENCY_COOKIE } from "@/lib/currency/display-currency";

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setDisplayCurrency(
  formData: FormData,
): Promise<SettingsActionResult> {
  const currency = formData.get("currency");
  if (typeof currency !== "string" || !isSupportedCurrency(currency)) {
    return { ok: false, error: "Invalid currency" };
  }

  const store = await cookies();
  store.set(DISPLAY_CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

const DEFAULT_FORMAT_CURRENCY = "IDR";

export function formatMoney(
  value: string | number,
  currency: string = DEFAULT_FORMAT_CURRENCY,
) {
  const parsed = typeof value === "string" ? Number(value) : value;
  const amount = Number.isNaN(parsed) ? 0 : parsed;

  const code = currency.length === 3 ? currency : DEFAULT_FORMAT_CURRENCY;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    ...(code === "IDR" ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(amount);
}

export function formatBudgetInputAmount(
  amount: number,
  currency: string,
): string {
  if (Number.isNaN(amount) || amount <= 0) {
    return "";
  }
  if (currency === "IDR") {
    return String(Math.round(amount));
  }
  return amount.toFixed(2);
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatMonthShort(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
  });
}

export function formatPercent(ratio: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(ratio);
}

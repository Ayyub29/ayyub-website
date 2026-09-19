const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(value: string | number, currency = "USD") {
  const amount = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(amount)) {
    return currencyFormatter.format(0);
  }

  if (currency === "USD") {
    return currencyFormatter.format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

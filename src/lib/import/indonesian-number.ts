/** Parses Indonesian-style amounts: 101.298.499,00 or 10566646,01 or Rp prefixes. */
export function parseIndonesianAmount(raw: string): number {
  let trimmed = raw.trim().replace(/\s/g, "");
  trimmed = trimmed.replace(/^Rp\.?/i, "");

  if (!trimmed) {
    throw new Error("Empty amount");
  }

  const commaDecimal = /,\d{1,4}$/.test(trimmed);
  if (commaDecimal) {
    const normalized = trimmed.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid amount: ${raw}`);
    }
    return parsed;
  }

  if (trimmed.includes(".") && !trimmed.includes(",")) {
    const parts = trimmed.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length <= 2) {
      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    const parsed = Number(trimmed.replace(/\./g, ""));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const parsed = Number(trimmed.replace(/,/g, ""));
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid amount: ${raw}`);
  }
  return parsed;
}

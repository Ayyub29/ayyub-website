/**
 * Parses dates from Google Sheets exports (mixed D/M/Y and M/D/Y).
 * - 17/08/2025 → 17 August (day > 12)
 * - 9/13/2025 → 13 September (second part > 12 → M/D)
 * - 8/12/2025 → 12 August (M/D when both parts ≤ 12 — US-style sheet dates)
 */
export function parseFlexibleSheetDate(raw: string): string {
  const parts = raw.trim().split(/[/-]/).map((p) => p.trim());
  if (parts.length !== 3) {
    throw new Error(`Invalid date: ${raw}`);
  }

  let a = Number(parts[0]);
  let b = Number(parts[1]);
  let year = Number(parts[2]);
  if (year < 100) {
    year += 2000;
  }

  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    !Number.isInteger(year)
  ) {
    throw new Error(`Invalid date: ${raw}`);
  }

  let day: number;
  let month: number;

  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    month = a;
    day = b;
  } else {
    month = a;
    day = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date: ${raw}`);
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

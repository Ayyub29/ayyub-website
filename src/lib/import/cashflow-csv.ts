import { parseCsvLine } from "./csv-line";

export type ParsedCashflowRow = {
  name: string;
  categoryName: string;
  amount: number;
  currency: "IDR" | "THB" | "USD";
  transactionDate: string;
  /** Original month label from sheet */
  monthLabel: string;
  lineNumber: number;
};

const MONTH_BY_NAME: Record<string, number> = {
  january: 1,
  januari: 1,
  february: 2,
  februari: 2,
  march: 3,
  maret: 3,
  april: 4,
  may: 5,
  mei: 5,
  june: 6,
  juni: 6,
  july: 7,
  juli: 7,
  august: 8,
  agustus: 8,
  september: 9,
  october: 10,
  oktober: 10,
  november: 11,
  december: 12,
  desember: 12,
};

/** Parses European-style numbers (445,5) and plain integers. */
export function parseSheetAmount(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) {
    throw new Error("Empty amount");
  }

  if (trimmed.includes(",") && !trimmed.includes(".")) {
    const parsed = Number(trimmed.replace(",", "."));
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid amount: ${raw}`);
    }
    return parsed;
  }

  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid amount: ${raw}`);
  }
  return parsed;
}

export function parseMonthLabelToDate(monthLabel: string): string {
  const parts = monthLabel.trim().split(/\s+/);
  if (parts.length < 2) {
    throw new Error(`Invalid month label: ${monthLabel}`);
  }

  const month = MONTH_BY_NAME[parts[0].toLowerCase()];
  const year = Number(parts[parts.length - 1]);

  if (!month || !Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`Invalid month label: ${monthLabel}`);
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Parses the Evaluation Center cashflow CSV export.
 * Columns (1-based): B=Expense, C=Category, D=Value (THB), E=Month, F=IDR (optional).
 * When F is present, amount and currency IDR are used; otherwise D as THB.
 */
export function parseCashflowCsv(content: string): {
  rows: ParsedCashflowRow[];
  skipped: Array<{ lineNumber: number; reason: string }>;
} {
  const rows: ParsedCashflowRow[] = [];
  const skipped: Array<{ lineNumber: number; reason: string }> = [];

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const cells = parseCsvLine(line);
    const expense = (cells[1] ?? "").trim();
    const category = (cells[2] ?? "").trim();
    const valueThb = (cells[3] ?? "").trim();
    const month = (cells[4] ?? "").trim();
    const valueIdr = (cells[5] ?? "").trim();

    if (
      expense.toLowerCase() === "expense" ||
      !category ||
      (!valueThb && !valueIdr)
    ) {
      continue;
    }

    if (!month) {
      skipped.push({ lineNumber, reason: "Missing month" });
      continue;
    }

    try {
      const transactionDate = parseMonthLabelToDate(month);
      let amount: number;
      let currency: "IDR" | "THB";

      if (valueIdr) {
        amount = parseSheetAmount(valueIdr);
        currency = "IDR";
      } else if (valueThb) {
        amount = parseSheetAmount(valueThb);
        currency = "THB";
      } else {
        skipped.push({ lineNumber, reason: "Missing amount" });
        continue;
      }

      if (amount <= 0) {
        skipped.push({ lineNumber, reason: "Non-positive amount" });
        continue;
      }

      const name = expense || category;

      rows.push({
        name,
        categoryName: category,
        amount,
        currency,
        transactionDate,
        monthLabel: month,
        lineNumber,
      });
    } catch (error) {
      skipped.push({
        lineNumber,
        reason: error instanceof Error ? error.message : "Parse error",
      });
    }
  }

  return { rows, skipped };
}

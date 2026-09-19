import type { PortfolioCategory, PortfolioTxType } from "@/lib/portfolio/constants";

import { parseCsvLine } from "./csv-line";
import { parseIndonesianAmount } from "./indonesian-number";

export type ParsedInvestmentLogRow = {
  transactionDate: string;
  type: PortfolioTxType;
  applicationName: string;
  name: string;
  value: number;
  transactionAmount: number;
  currency: "IDR" | "THB" | "USD";
  category: PortfolioCategory | null;
  description: string | null;
  lineNumber: number;
  sheetType: string;
};

export function parseInvestmentLogDate(raw: string): string {
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
    day = a;
    month = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date: ${raw}`);
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeCurrency(raw: string): "IDR" | "THB" | "USD" {
  const code = raw.trim().toUpperCase();
  if (code === "IDR" || code === "THB" || code === "USD") {
    return code;
  }
  throw new Error(`Unsupported currency: ${raw}`);
}

function mapPortfolioType(
  rawType: string,
  rawCategory: string,
): PortfolioTxType {
  const type = rawType.trim().toLowerCase();
  const category = rawCategory.trim().toLowerCase();

  if (type.includes("deposit")) {
    return "deposit";
  }
  if (type.includes("cash out") || type === "draw") {
    return "draw";
  }
  if (type === "return") {
    return "deposit";
  }
  if (type.includes("buy")) {
    return "buy";
  }
  if (type.includes("sell")) {
    return "sell";
  }

  if (category === "deposit") {
    return "deposit";
  }

  throw new Error(`Unknown transaction type: ${rawType}`);
}

function mapPortfolioCategory(
  raw: string,
  type: PortfolioTxType,
): PortfolioCategory | null {
  if (type === "deposit" || type === "draw") {
    return null;
  }

  const category = raw.trim().toLowerCase();
  if (category === "stocks" || category === "stock") {
    return "stock";
  }
  if (category === "p2p") {
    return "p2p";
  }
  if (category === "bond" || category === "bonds") {
    return "obligasi";
  }
  if (category === "bitcoin" || category === "crypto") {
    return "crypto";
  }

  throw new Error(`Unknown portfolio category: ${raw}`);
}

function normalizeApplicationName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function buildDescription(
  details: string,
  sheetType: string,
  mappedType: PortfolioTxType,
): string | null {
  const parts = [details.trim(), sheetType.trim()].filter(Boolean);
  if (mappedType === "deposit" && sheetType.toLowerCase() === "return") {
    parts.unshift("Sheet: Return (imported as deposit)");
  }
  const text = parts.join(" · ");
  return text.length > 0 ? text.slice(0, 2000) : null;
}

/**
 * Investment log export columns:
 * B Date, C Name, D Transaction Type, E Currency, F Lot Amount,
 * G Transaction Value, H Transaction Value in Currency, I Category, J Platform, K Details
 *
 * Amount uses column G (Transaction Value) in currency E.
 */
export function parseInvestmentLogCsv(content: string): {
  rows: ParsedInvestmentLogRow[];
  skipped: Array<{ lineNumber: number; reason: string }>;
} {
  const rows: ParsedInvestmentLogRow[] = [];
  const skipped: Array<{ lineNumber: number; reason: string }> = [];

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const cells = parseCsvLine(line);
    const dateRaw = (cells[1] ?? "").trim();
    const name = (cells[2] ?? "").trim();
    const sheetType = (cells[3] ?? "").trim();
    const currencyRaw = (cells[4] ?? "").trim();
    const lotRaw = (cells[5] ?? "").trim();
    const amountRaw = (cells[6] ?? "").trim();
    const categoryRaw = (cells[8] ?? "").trim();
    const platformRaw = (cells[9] ?? "").trim();
    const details = (cells[10] ?? "").trim();

    if (dateRaw.toLowerCase() === "date" || !dateRaw || !sheetType) {
      continue;
    }

    if (!platformRaw) {
      skipped.push({ lineNumber, reason: "Missing platform" });
      continue;
    }

    try {
      const transactionDate = parseInvestmentLogDate(dateRaw);
      const type = mapPortfolioType(sheetType, categoryRaw);
      const category = mapPortfolioCategory(categoryRaw, type);
      const currency = normalizeCurrency(currencyRaw);
      const transactionAmount = parseIndonesianAmount(amountRaw);
      const value =
        type === "deposit" || type === "draw"
          ? 0
          : parseIndonesianAmount(lotRaw || "0");

      if (transactionAmount <= 0) {
        skipped.push({ lineNumber, reason: "Non-positive amount" });
        continue;
      }

      if ((type === "buy" || type === "sell") && value <= 0) {
        skipped.push({ lineNumber, reason: "Missing lot amount for trade" });
        continue;
      }

      const displayName =
        name ||
        (type === "deposit" || type === "draw" ? "Cash" : categoryRaw || "Asset");

      rows.push({
        transactionDate,
        type,
        applicationName: normalizeApplicationName(platformRaw),
        name: displayName,
        value,
        transactionAmount,
        currency,
        category,
        description: buildDescription(details, sheetType, type),
        lineNumber,
        sheetType,
      });
    } catch (error) {
      skipped.push({
        lineNumber,
        reason: error instanceof Error ? error.message : "Parse error",
      });
    }
  }

  rows.sort((a, b) =>
    a.transactionDate.localeCompare(b.transactionDate) ||
    a.lineNumber - b.lineNumber,
  );

  return { rows, skipped };
}

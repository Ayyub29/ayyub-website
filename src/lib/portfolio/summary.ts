import type { SupportedCurrency } from "@/lib/currencies";
import {
  convertWithMatrix,
  type ExchangeRateMatrix,
} from "@/lib/currency/google-rates";

import type { PortfolioCategory, PortfolioTxType } from "./constants";
import { PORTFOLIO_CATEGORY_LABELS } from "./constants";
import {
  holdingPositionKey,
  isOpenPosition,
  normalizeHoldingName,
} from "./holding-identity";

export type PortfolioTxRow = {
  id: string;
  type: PortfolioTxType;
  category: PortfolioCategory | null;
  name: string;
  value: string;
  transactionAmount: string;
  currency: string;
  description: string | null;
  transactionDate: string;
  applicationId: string;
  applicationName: string;
};

export type CashByCurrency = Record<string, number>;

export type HoldingRow = {
  applicationId: string;
  applicationName: string;
  category: PortfolioCategory;
  name: string;
  quantity: number;
  netInvested: number;
  netInvestedDisplay: number;
};

export type ApplicationSummary = {
  applicationId: string;
  applicationName: string;
  idleCashByCurrency: CashByCurrency;
  idleCashDisplay: number;
  holdings: HoldingRow[];
};

export type CategorySummary = {
  category: PortfolioCategory;
  categoryLabel: string;
  holdings: HoldingRow[];
  netInvestedDisplay: number;
};

export type PortfolioSummary = {
  holdings: HoldingRow[];
  byApplication: ApplicationSummary[];
  byCategory: CategorySummary[];
  displayCurrency: SupportedCurrency;
};

type PositionState = {
  applicationId: string;
  applicationName: string;
  category: PortfolioCategory;
  name: string;
  totalBuyUnits: number;
  totalSellUnits: number;
  /** Sum of buy transaction amounts only (cost basis before sells). */
  totalBuyCostByCurrency: CashByCurrency;
};

function toDisplay(
  amount: number,
  currency: string,
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
) {
  const from = (currency.length === 3 ? currency : displayCurrency) as SupportedCurrency;
  return convertWithMatrix(amount, from, displayCurrency, rates);
}

function addCash(map: CashByCurrency, currency: string, delta: number) {
  map[currency] = (map[currency] ?? 0) + delta;
}

export function buildPortfolioSummary(
  transactions: PortfolioTxRow[],
  applicationNames: Map<string, string>,
  displayCurrency: SupportedCurrency,
  rates: ExchangeRateMatrix,
): PortfolioSummary {
  const sorted = [...transactions].sort((a, b) =>
    a.transactionDate.localeCompare(b.transactionDate),
  );

  const idleByApp = new Map<string, CashByCurrency>();
  const holdings = new Map<string, PositionState>();

  for (const tx of sorted) {
    const appCash = idleByApp.get(tx.applicationId) ?? {};
    const amount = Number(tx.transactionAmount);
    const units = Number(tx.value);
    if (Number.isNaN(amount) || Number.isNaN(units)) {
      continue;
    }

    switch (tx.type) {
      case "deposit":
        addCash(appCash, tx.currency, amount);
        break;
      case "draw":
        addCash(appCash, tx.currency, -amount);
        break;
      case "buy": {
        addCash(appCash, tx.currency, -amount);
        if (!tx.category) {
          break;
        }
        const canonical = normalizeHoldingName(tx.name, tx.category);
        const key = holdingPositionKey(tx.applicationId, tx.category, tx.name);
        const existing = holdings.get(key) ?? {
          applicationId: tx.applicationId,
          applicationName: tx.applicationName,
          category: tx.category,
          name: canonical,
          totalBuyUnits: 0,
          totalSellUnits: 0,
          totalBuyCostByCurrency: {},
        };
        existing.totalBuyUnits += units;
        addCash(existing.totalBuyCostByCurrency, tx.currency, amount);
        holdings.set(key, existing);
        break;
      }
      case "sell": {
        addCash(appCash, tx.currency, amount);
        if (!tx.category) {
          break;
        }
        const canonical = normalizeHoldingName(tx.name, tx.category);
        const key = holdingPositionKey(tx.applicationId, tx.category, tx.name);
        const existing = holdings.get(key) ?? {
          applicationId: tx.applicationId,
          applicationName: tx.applicationName,
          category: tx.category,
          name: canonical,
          totalBuyUnits: 0,
          totalSellUnits: 0,
          totalBuyCostByCurrency: {},
        };
        existing.totalSellUnits += units;
        holdings.set(key, existing);
        break;
      }
      default:
        break;
    }

    idleByApp.set(tx.applicationId, appCash);
  }

  const holdingRows: HoldingRow[] = [];
  for (const h of holdings.values()) {
    if (!isOpenPosition(h.totalBuyUnits, h.totalSellUnits)) {
      continue;
    }

    const quantity = h.totalBuyUnits - h.totalSellUnits;
    const costScale =
      h.totalBuyUnits > 0 ? quantity / h.totalBuyUnits : 0;
    let netInvestedDisplay = 0;
    let netInvestedRaw = 0;
    for (const [cur, val] of Object.entries(h.totalBuyCostByCurrency)) {
      const remaining = val * costScale;
      netInvestedRaw += remaining;
      netInvestedDisplay += toDisplay(
        remaining,
        cur,
        displayCurrency,
        rates,
      );
    }
    holdingRows.push({
      applicationId: h.applicationId,
      applicationName: h.applicationName,
      category: h.category,
      name: h.name,
      quantity,
      netInvested: netInvestedRaw,
      netInvestedDisplay,
    });
  }

  holdingRows.sort(
    (a, b) =>
      a.applicationName.localeCompare(b.applicationName) ||
      a.name.localeCompare(b.name),
  );

  const byApplication: ApplicationSummary[] = [];
  for (const [applicationId, appName] of applicationNames) {
    const cash = idleByApp.get(applicationId) ?? {};
    let idleCashDisplay = 0;
    for (const [cur, val] of Object.entries(cash)) {
      idleCashDisplay += toDisplay(val, cur, displayCurrency, rates);
    }
    const appHoldings = holdingRows.filter(
      (h) => h.applicationId === applicationId,
    );
    byApplication.push({
      applicationId,
      applicationName: appName,
      idleCashByCurrency: cash,
      idleCashDisplay,
      holdings: appHoldings,
    });
  }

  byApplication.sort((a, b) =>
    a.applicationName.localeCompare(b.applicationName),
  );

  const categoryMap = new Map<PortfolioCategory, HoldingRow[]>();
  for (const row of holdingRows) {
    const list = categoryMap.get(row.category) ?? [];
    list.push(row);
    categoryMap.set(row.category, list);
  }

  const byCategory: CategorySummary[] = [...categoryMap.entries()]
    .map(([category, rows]) => ({
      category,
      categoryLabel: PORTFOLIO_CATEGORY_LABELS[category],
      holdings: rows,
      netInvestedDisplay: rows.reduce(
        (sum, r) => sum + r.netInvestedDisplay,
        0,
      ),
    }))
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));

  return {
    holdings: holdingRows,
    byApplication,
    byCategory,
    displayCurrency,
  };
}

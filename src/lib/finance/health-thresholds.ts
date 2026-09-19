import { getDb, schema } from "@/db";

import {
  DEFAULT_FINANCE_HEALTH_THRESHOLDS,
  THRESHOLD_KEYS,
  type FinanceHealthThresholds,
  type ThresholdKey,
} from "./health-thresholds.constants";

export {
  DEFAULT_FINANCE_HEALTH_THRESHOLDS,
  THRESHOLD_KEYS,
  THRESHOLD_LABELS,
  type FinanceHealthThresholds,
  type ThresholdKey,
} from "./health-thresholds.constants";

export async function getFinanceHealthThresholds(): Promise<FinanceHealthThresholds> {
  const db = getDb();
  const rows = await db.query.financeHealthThresholds.findMany();

  const merged = { ...DEFAULT_FINANCE_HEALTH_THRESHOLDS };
  for (const row of rows) {
    const key = row.key as ThresholdKey;
    if (THRESHOLD_KEYS.includes(key)) {
      merged[key] = Number(row.value);
    }
  }

  return merged;
}

export async function upsertFinanceHealthThresholds(
  values: Partial<FinanceHealthThresholds>,
) {
  const db = getDb();
  for (const key of THRESHOLD_KEYS) {
    const value = values[key];
    if (value == null || Number.isNaN(value)) {
      continue;
    }
    await db
      .insert(schema.financeHealthThresholds)
      .values({
        key,
        value: value.toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.financeHealthThresholds.key,
        set: {
          value: value.toFixed(4),
          updatedAt: new Date(),
        },
      });
  }
}

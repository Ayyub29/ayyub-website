"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, schema } from "@/db";
import {
  THRESHOLD_KEYS,
  THRESHOLD_LABELS,
  upsertFinanceHealthThresholds,
} from "@/lib/finance/health-thresholds";
import {
  financeHealthThresholdsSchema,
  liabilityInputSchema,
  liabilityUpdateSchema,
} from "@/lib/validations/finance";

export type FinanceActionResult =
  | { ok: true }
  | { ok: false; error: string };

function fail(message: string): FinanceActionResult {
  return { ok: false, error: message };
}

function revalidateFinance() {
  revalidatePath("/statement");
  revalidatePath("/settings/liabilities");
  revalidatePath("/settings/finance-health");
}

export async function createFinancialLiability(
  _prev: FinanceActionResult | null,
  formData: FormData,
): Promise<FinanceActionResult> {
  const parsed = liabilityInputSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    balance: formData.get("balance"),
    annualPayment: formData.get("annualPayment"),
    currency: formData.get("currency"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  let sortOrder = parsed.data.sortOrder;
  if (sortOrder == null) {
    const [{ maxOrder }] = await db
      .select({
        maxOrder: sql<number>`coalesce(max(${schema.financialLiabilities.sortOrder}), 0)`,
      })
      .from(schema.financialLiabilities);
    sortOrder = Number(maxOrder) + 1;
  }

  await db.insert(schema.financialLiabilities).values({
    name: parsed.data.name,
    kind: parsed.data.kind,
    balance: parsed.data.balance.toFixed(2),
    annualPayment: parsed.data.annualPayment.toFixed(2),
    currency: parsed.data.currency,
    sortOrder,
  });

  revalidateFinance();
  return { ok: true };
}

export async function updateFinancialLiability(
  _prev: FinanceActionResult | null,
  formData: FormData,
): Promise<FinanceActionResult> {
  const parsed = liabilityUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    balance: formData.get("balance"),
    annualPayment: formData.get("annualPayment"),
    currency: formData.get("currency"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const { id, ...data } = parsed.data;

  await db
    .update(schema.financialLiabilities)
    .set({
      name: data.name,
      kind: data.kind,
      balance: data.balance.toFixed(2),
      annualPayment: data.annualPayment.toFixed(2),
      currency: data.currency,
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.financialLiabilities.id, id));

  revalidateFinance();
  return { ok: true };
}

export async function deleteFinancialLiability(
  formData: FormData,
): Promise<FinanceActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return fail("Missing liability id");
  }

  const db = getDb();
  await db
    .delete(schema.financialLiabilities)
    .where(eq(schema.financialLiabilities.id, id));

  revalidateFinance();
  return { ok: true };
}

export async function updateFinanceHealthThresholds(
  _prev: FinanceActionResult | null,
  formData: FormData,
): Promise<FinanceActionResult> {
  const raw = Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, value]),
  );

  const parsed = financeHealthThresholdsSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const values = { ...parsed.data };
  for (const key of THRESHOLD_KEYS) {
    if (THRESHOLD_LABELS[key].unit === "percent" && values[key] > 1) {
      values[key] = values[key] / 100;
    }
  }

  if (
    values.liquidity_months_min > values.liquidity_months_max
  ) {
    return fail("Liquidity minimum months cannot exceed maximum");
  }

  await upsertFinanceHealthThresholds(values);
  revalidateFinance();
  return { ok: true };
}

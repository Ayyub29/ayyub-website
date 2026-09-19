"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, schema } from "@/db";
import { getDisplayCurrency } from "@/lib/currency/display-currency";
import {
  categoryBudgetDefaultSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  monthlyAccountBalanceSchema,
  transactionInputSchema,
} from "@/lib/validations/money";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function fail(message: string): ActionResult {
  return { ok: false, error: message };
}

export async function createTransaction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = transactionInputSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    transactionDate: formData.get("transactionDate"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, parsed.data.categoryId),
  });

  if (!category) {
    return fail("Category not found");
  }

  await db.insert(schema.transactions).values({
    name: parsed.data.name,
    amount: parsed.data.amount.toFixed(2),
    currency: parsed.data.currency,
    transactionDate: parsed.data.transactionDate,
    categoryId: parsed.data.categoryId,
    description: parsed.data.name,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { ok: true };
}

export async function deleteTransactionById(id: string): Promise<ActionResult> {
  if (!id) {
    return fail("Missing transaction id");
  }

  const db = getDb();
  await db.delete(schema.transactions).where(eq(schema.transactions.id, id));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { ok: true };
}

export async function deleteTransaction(
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return fail("Missing transaction id");
  }
  return deleteTransactionById(id);
}

export async function createCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color") || undefined,
    defaultMonthlyBudget: formData.get("defaultMonthlyBudget"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const displayCurrency = await getDisplayCurrency();
  await db.insert(schema.categories).values({
    name: parsed.data.name,
    kind: parsed.data.kind,
    color: parsed.data.color ?? "#64748b",
    defaultMonthlyBudget:
      parsed.data.kind === "expense" && parsed.data.defaultMonthlyBudget != null
        ? parsed.data.defaultMonthlyBudget.toFixed(2)
        : null,
    budgetCurrency:
      parsed.data.kind === "expense" && parsed.data.defaultMonthlyBudget != null
        ? displayCurrency
        : null,
  });

  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/settings/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categoryUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color") || undefined,
    defaultMonthlyBudget: formData.get("defaultMonthlyBudget"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const displayCurrency = await getDisplayCurrency();
  const { id, name, kind, color, defaultMonthlyBudget } = parsed.data;

  await db
    .update(schema.categories)
    .set({
      name,
      kind,
      color: color ?? "#64748b",
      defaultMonthlyBudget:
        kind === "expense" && defaultMonthlyBudget != null
          ? defaultMonthlyBudget.toFixed(2)
          : null,
      budgetCurrency:
        kind === "expense" && defaultMonthlyBudget != null
          ? displayCurrency
          : null,
    })
    .where(eq(schema.categories.id, id));

  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/settings/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCategory(
  formData: FormData,
): Promise<ActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return fail("Missing category id");
  }

  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.transactions)
    .where(eq(schema.transactions.categoryId, id));

  if (Number(count) > 0) {
    return fail(
      `Cannot delete: ${count} transaction(s) use this category. Reassign or delete them first.`,
    );
  }

  await db.delete(schema.categories).where(eq(schema.categories.id, id));

  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/settings/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCategoryDefaultBudget(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categoryBudgetDefaultSchema.safeParse({
    categoryId: formData.get("categoryId"),
    defaultMonthlyBudget: formData.get("defaultMonthlyBudget"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const displayCurrency = await getDisplayCurrency();
  await db
    .update(schema.categories)
    .set({
      defaultMonthlyBudget: parsed.data.defaultMonthlyBudget.toFixed(2),
      budgetCurrency: displayCurrency,
    })
    .where(eq(schema.categories.id, parsed.data.categoryId));

  revalidatePath("/settings/budget");
  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertMonthlyAccountBalances(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = monthlyAccountBalanceSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    idrBalance: formData.get("idrBalance"),
    thbBalance: formData.get("thbBalance"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const { year, month, idrBalance, thbBalance } = parsed.data;

  await db
    .insert(schema.monthlyAccountBalances)
    .values({
      year,
      month,
      idrBalance: idrBalance.toFixed(2),
      thbBalance: thbBalance.toFixed(2),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        schema.monthlyAccountBalances.year,
        schema.monthlyAccountBalances.month,
      ],
      set: {
        idrBalance: idrBalance.toFixed(2),
        thbBalance: thbBalance.toFixed(2),
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard");
  return { ok: true };
}

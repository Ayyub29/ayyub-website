"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, schema } from "@/db";
import {
  portfolioApplicationInputSchema,
  portfolioApplicationUpdateSchema,
  portfolioTransactionInputSchema,
} from "@/lib/validations/portfolio";

export type PortfolioActionResult =
  | { ok: true }
  | { ok: false; error: string };

function fail(message: string): PortfolioActionResult {
  return { ok: false, error: message };
}

export async function createPortfolioTransaction(
  _prev: PortfolioActionResult | null,
  formData: FormData,
): Promise<PortfolioActionResult> {
  const parsed = portfolioTransactionInputSchema.safeParse({
    type: formData.get("type"),
    applicationId: formData.get("applicationId"),
    name: formData.get("name"),
    value: formData.get("value"),
    transactionAmount: formData.get("transactionAmount"),
    currency: formData.get("currency"),
    category: formData.get("category"),
    description: formData.get("description"),
    transactionDate: formData.get("transactionDate"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const application = await db.query.portfolioApplications.findFirst({
    where: eq(schema.portfolioApplications.id, parsed.data.applicationId),
  });

  if (!application) {
    return fail("Application not found");
  }

  const data = parsed.data;
  const name =
    data.name.trim() ||
    (data.type === "deposit" ? "Account deposit" : "Account draw");

  await db.insert(schema.portfolioTransactions).values({
    applicationId: data.applicationId,
    type: data.type,
    category: data.category ?? null,
    name,
    value: (data.value ?? 0).toFixed(4),
    transactionAmount: data.transactionAmount.toFixed(2),
    currency: data.currency,
    description: data.description ?? null,
    transactionDate: data.transactionDate,
  });

  revalidatePath("/portfolio");
  revalidatePath("/portfolio/transactions");
  return { ok: true };
}

export async function deletePortfolioTransaction(
  formData: FormData,
): Promise<PortfolioActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return fail("Missing transaction id");
  }

  const db = getDb();
  await db
    .delete(schema.portfolioTransactions)
    .where(eq(schema.portfolioTransactions.id, id));

  revalidatePath("/portfolio");
  revalidatePath("/portfolio/transactions");
  return { ok: true };
}

function revalidatePortfolioApps() {
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/transactions");
  revalidatePath("/settings/portfolio-apps");
}

export async function createPortfolioApplication(
  _prev: PortfolioActionResult | null,
  formData: FormData,
): Promise<PortfolioActionResult> {
  const parsed = portfolioApplicationInputSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const existing = await db.query.portfolioApplications.findFirst({
    where: eq(schema.portfolioApplications.name, parsed.data.name),
  });

  if (existing) {
    return fail("An application with this name already exists");
  }

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder == null) {
    const [{ maxOrder }] = await db
      .select({
        maxOrder: sql<number>`coalesce(max(${schema.portfolioApplications.sortOrder}), 0)`,
      })
      .from(schema.portfolioApplications);
    sortOrder = Number(maxOrder) + 1;
  }

  await db.insert(schema.portfolioApplications).values({
    name: parsed.data.name,
    sortOrder,
  });

  revalidatePortfolioApps();
  return { ok: true };
}

export async function updatePortfolioApplication(
  _prev: PortfolioActionResult | null,
  formData: FormData,
): Promise<PortfolioActionResult> {
  const parsed = portfolioApplicationUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const duplicate = await db.query.portfolioApplications.findFirst({
    where: eq(schema.portfolioApplications.name, parsed.data.name),
  });

  if (duplicate && duplicate.id !== parsed.data.id) {
    return fail("An application with this name already exists");
  }

  await db
    .update(schema.portfolioApplications)
    .set({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .where(eq(schema.portfolioApplications.id, parsed.data.id));

  revalidatePortfolioApps();
  return { ok: true };
}

export async function deletePortfolioApplication(
  formData: FormData,
): Promise<PortfolioActionResult> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return fail("Missing application id");
  }

  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.portfolioTransactions)
    .where(eq(schema.portfolioTransactions.applicationId, id));

  if (Number(count) > 0) {
    return fail(
      `Cannot delete: ${count} portfolio transaction(s) use this application. Delete or reassign them first.`,
    );
  }

  await db
    .delete(schema.portfolioApplications)
    .where(eq(schema.portfolioApplications.id, id));

  revalidatePortfolioApps();
  return { ok: true };
}

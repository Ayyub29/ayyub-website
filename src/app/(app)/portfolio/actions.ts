"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, schema } from "@/db";
import { portfolioTransactionInputSchema } from "@/lib/validations/portfolio";

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

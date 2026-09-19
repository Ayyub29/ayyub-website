import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertLocalImportAllowed } from "@/lib/import/import-guard";

const importRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  categoryName: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  currency: z.enum(["IDR", "THB", "USD"]),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const bodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  createMissingCategories: z.boolean().optional().default(true),
  rows: z.array(importRowSchema).min(1).max(5000),
});

export async function POST(request: Request) {
  const gate = assertLocalImportAllowed(request);
  if (!gate.allowed) {
    return gate.response;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      },
      { status: 400 },
    );
  }

  const { dryRun, createMissingCategories, rows } = parsed.data;
  const db = getDb();

  const categories = await db.query.categories.findMany({
    where: eq(schema.categories.kind, "expense"),
  });

  const categoryIdByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id]),
  );

  const createdCategories: string[] = [];
  const errors: Array<{ index: number; error: string }> = [];
  const toInsert: Array<{
    name: string;
    amount: string;
    currency: string;
    transactionDate: string;
    categoryId: string;
    description: string;
  }> = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const key = row.categoryName.toLowerCase();
    let categoryId = categoryIdByName.get(key);

    if (!categoryId && createMissingCategories) {
      if (dryRun) {
        createdCategories.push(row.categoryName);
        categoryId = `dry-run-${key}`;
      } else {
        const [inserted] = await db
          .insert(schema.categories)
          .values({
            name: row.categoryName,
            kind: "expense",
            color: "#64748b",
            sortOrder: 900,
          })
          .returning({ id: schema.categories.id });
        categoryId = inserted.id;
        categoryIdByName.set(key, categoryId);
        createdCategories.push(row.categoryName);
      }
    }

    if (!categoryId) {
      errors.push({
        index,
        error: `Unknown category: ${row.categoryName}`,
      });
      continue;
    }

    if (dryRun) {
      continue;
    }

    toInsert.push({
      name: row.name,
      amount: row.amount.toFixed(2),
      currency: row.currency,
      transactionDate: row.transactionDate,
      categoryId,
      description: `Imported from cashflow CSV (${row.categoryName})`,
    });
  }

  if (!dryRun && toInsert.length > 0) {
    await db.insert(schema.transactions).values(toInsert);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    received: rows.length,
    inserted: dryRun ? 0 : toInsert.length,
    skipped: errors.length,
    createdCategories: [...new Set(createdCategories)],
    errors: errors.slice(0, 50),
  });
}

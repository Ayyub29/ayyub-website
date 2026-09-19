import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertLocalImportAllowed } from "@/lib/import/import-guard";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_TX_TYPES,
} from "@/lib/portfolio/constants";

const importRowSchema = z
  .object({
    type: z.enum(PORTFOLIO_TX_TYPES),
    applicationName: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(200),
    value: z.number().min(0),
    transactionAmount: z.number().positive(),
    currency: z.enum(["IDR", "THB", "USD"]),
    category: z.enum(PORTFOLIO_CATEGORIES).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((row, ctx) => {
    const isTrade = row.type === "buy" || row.type === "sell";
    if (isTrade && !row.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category required for buy/sell",
        path: ["category"],
      });
    }
    if (isTrade && row.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Value required for buy/sell",
        path: ["value"],
      });
    }
  });

const bodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  createMissingApplications: z.boolean().optional().default(true),
  rows: z.array(importRowSchema).min(1).max(5000),
});

function normalizeAppName(name: string) {
  return name.trim().toLowerCase();
}

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

  const { dryRun, createMissingApplications, rows } = parsed.data;
  const db = getDb();

  const applications = await db.query.portfolioApplications.findMany();
  const appIdByName = new Map(
    applications.map((app) => [normalizeAppName(app.name), app.id]),
  );

  const createdApplications: string[] = [];
  const errors: Array<{ index: number; error: string }> = [];
  const toInsert: Array<typeof schema.portfolioTransactions.$inferInsert> = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const appKey = normalizeAppName(row.applicationName);
    let applicationId = appIdByName.get(appKey);

    if (!applicationId && createMissingApplications) {
      if (dryRun) {
        createdApplications.push(row.applicationName);
        applicationId = `dry-run-${appKey}`;
      } else {
        const [inserted] = await db
          .insert(schema.portfolioApplications)
          .values({
            name: row.applicationName,
            sortOrder: 950,
          })
          .returning({ id: schema.portfolioApplications.id });
        applicationId = inserted.id;
        appIdByName.set(appKey, applicationId);
        createdApplications.push(row.applicationName);
      }
    }

    if (!applicationId) {
      errors.push({
        index,
        error: `Unknown platform/application: ${row.applicationName}`,
      });
      continue;
    }

    if (dryRun) {
      continue;
    }

    toInsert.push({
      applicationId,
      type: row.type,
      category: row.category ?? null,
      name: row.name,
      value: row.value.toFixed(4),
      transactionAmount: row.transactionAmount.toFixed(2),
      currency: row.currency,
      description: row.description ?? null,
      transactionDate: row.transactionDate,
    });
  }

  if (!dryRun && toInsert.length > 0) {
    await db.insert(schema.portfolioTransactions).values(toInsert);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    received: rows.length,
    inserted: dryRun ? 0 : toInsert.length,
    skipped: errors.length,
    createdApplications: [...new Set(createdApplications)],
    errors: errors.slice(0, 50),
  });
}

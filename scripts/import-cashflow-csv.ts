/**
 * POST parsed cashflow CSV rows to the local import API.
 *
 * Usage:
 *   IMPORT_SECRET=your-secret npm run import:cashflow -- path/to/file.csv
 *
 * Optional:
 *   BASE_URL=http://localhost:3000
 *   DRY_RUN=1
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCashflowCsv } from "../src/lib/import/cashflow-csv";

const BATCH_SIZE = 200;

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      "Usage: IMPORT_SECRET=... npm run import:cashflow -- <path-to.csv>",
    );
    process.exit(1);
  }

  const secret = process.env.IMPORT_SECRET?.trim();
  if (!secret) {
    console.error("Set IMPORT_SECRET in the environment (match .env.local).");
    process.exit(1);
  }

  const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

  const absolute = resolve(filePath);
  const content = readFileSync(absolute, "utf8");
  const { rows, skipped } = parseCashflowCsv(content);

  console.log(`Parsed ${rows.length} transactions from ${absolute}`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} lines (first 5):`);
    for (const s of skipped.slice(0, 5)) {
      console.log(`  line ${s.lineNumber}: ${s.reason}`);
    }
  }

  const idrCount = rows.filter((r) => r.currency === "IDR").length;
  const thbCount = rows.filter((r) => r.currency === "THB").length;
  console.log(`Currency split: ${idrCount} IDR (column F), ${thbCount} THB (column D)`);

  let insertedTotal = 0;
  let batchIndex = 0;

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    batchIndex += 1;
    const batch = rows.slice(offset, offset + BATCH_SIZE).map(
      ({ name, categoryName, amount, currency, transactionDate }) => ({
        name,
        categoryName,
        amount,
        currency,
        transactionDate,
      }),
    );

    const response = await fetch(`${baseUrl}/api/import/cashflow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-import-secret": secret,
      },
      body: JSON.stringify({
        dryRun,
        createMissingCategories: true,
        rows: batch,
      }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      inserted?: number;
      skipped?: number;
      createdCategories?: string[];
      errors?: Array<{ index: number; error: string }>;
    };

    if (!response.ok || !payload.ok) {
      console.error(`Batch ${batchIndex} failed:`, payload.error ?? response.statusText);
      if (payload.errors?.length) {
        console.error(payload.errors.slice(0, 5));
      }
      process.exit(1);
    }

    insertedTotal += payload.inserted ?? 0;
    if (payload.createdCategories?.length) {
      console.log(
        `Batch ${batchIndex}: created categories:`,
        payload.createdCategories.join(", "),
      );
    }
    if (payload.errors?.length) {
      console.warn(
        `Batch ${batchIndex}: row errors:`,
        payload.errors.slice(0, 3),
      );
    }
  }

  console.log(
    dryRun
      ? `Dry run complete (${rows.length} rows validated).`
      : `Import complete. Inserted ${insertedTotal} transactions.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

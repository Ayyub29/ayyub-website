import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { and, eq, sql } from "drizzle-orm";

import { getDb, schema } from "../src/db";
import {
  DEFAULT_CATEGORIES,
  isDefaultCategory,
} from "../src/lib/categories/defaults";

async function main() {
  const db = getDb();
  let created = 0;
  let updated = 0;
  let removed = 0;
  let skippedRemove = 0;

  for (const category of DEFAULT_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: and(
        eq(schema.categories.name, category.name),
        eq(schema.categories.kind, category.kind),
      ),
    });

    if (existing) {
      await db
        .update(schema.categories)
        .set({
          color: category.color,
          sortOrder: category.sortOrder,
        })
        .where(eq(schema.categories.id, existing.id));
      updated += 1;
    } else {
      await db.insert(schema.categories).values({
        name: category.name,
        kind: category.kind,
        color: category.color,
        sortOrder: category.sortOrder,
      });
      created += 1;
    }
  }

  const allCategories = await db.query.categories.findMany();

  for (const category of allCategories) {
    if (isDefaultCategory(category.name, category.kind)) {
      continue;
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.transactions)
      .where(eq(schema.transactions.categoryId, category.id));

    if (Number(count) > 0) {
      console.warn(
        `Skipped remove "${category.name}" (${category.kind}): has ${count} transaction(s). Reassign or delete those first.`,
      );
      skippedRemove += 1;
      continue;
    }

    await db.delete(schema.categories).where(eq(schema.categories.id, category.id));
    removed += 1;
  }

  console.log(
    `Categories sync complete. Created ${created}, updated ${updated}, removed ${removed}, skipped remove ${skippedRemove}. Expected ${DEFAULT_CATEGORIES.length} categories.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

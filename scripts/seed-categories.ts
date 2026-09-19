import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { and, eq } from "drizzle-orm";

import { getDb, schema } from "../src/db";
import { DEFAULT_CATEGORIES } from "../src/lib/categories/defaults";

async function main() {
  const db = getDb();
  let created = 0;
  let updated = 0;

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

  console.log(
    `Categories sync complete. Created ${created}, updated ${updated} (${DEFAULT_CATEGORIES.length} defaults). Custom categories are left unchanged.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

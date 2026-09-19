import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { eq } from "drizzle-orm";

import { getDb, schema } from "../src/db";
import { DEFAULT_PORTFOLIO_APPLICATIONS } from "../src/lib/portfolio/constants";

async function main() {
  const db = getDb();
  let created = 0;

  for (const app of DEFAULT_PORTFOLIO_APPLICATIONS) {
    const existing = await db.query.portfolioApplications.findFirst({
      where: eq(schema.portfolioApplications.name, app.name),
    });

    if (!existing) {
      await db.insert(schema.portfolioApplications).values({
        name: app.name,
        sortOrder: app.sortOrder,
      });
      created += 1;
    }
  }

  console.log(`Portfolio applications: ${created} created.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

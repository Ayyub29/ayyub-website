import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let db: Db | undefined;

export function getDb(): Db {
  if (db) {
    return db;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }

  const client = postgres(url, { prepare: false, max: 10 });
  db = drizzle(client, { schema });
  return db;
}

export { schema };

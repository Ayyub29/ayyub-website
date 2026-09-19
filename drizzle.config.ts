import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  throw new Error(
    [
      "DATABASE_URL is missing or empty.",
      "Create .env.local in the project root (copy .env.example) and set your Neon pooled connection string.",
      "Example: DATABASE_URL=\"postgresql://user:pass@host/neondb?sslmode=require\"",
    ].join("\n"),
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});

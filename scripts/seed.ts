import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { execSync } from "node:child_process";

async function main() {
  execSync("tsx scripts/seed-categories.ts", { stdio: "inherit" });
  console.log("Seed complete (categories). Add transactions from the app.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

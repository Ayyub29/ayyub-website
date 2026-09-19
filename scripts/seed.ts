import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { getDb, schema } from "../src/db";

async function main() {
  const db = getDb();

  const existing = await db.query.categories.findFirst();
  if (existing) {
    console.log("Seed skipped: categories already exist.");
    return;
  }

  const categories = await db
    .insert(schema.categories)
    .values([
      { name: "Salary", kind: "income", color: "#16a34a", sortOrder: 1 },
      { name: "Freelance", kind: "income", color: "#059669", sortOrder: 2 },
      {
        name: "Rent",
        kind: "expense",
        color: "#dc2626",
        sortOrder: 10,
        defaultMonthlyBudget: "1200.00",
      },
      {
        name: "Groceries",
        kind: "expense",
        color: "#ea580c",
        sortOrder: 11,
        defaultMonthlyBudget: "400.00",
      },
      {
        name: "Transport",
        kind: "expense",
        color: "#2563eb",
        sortOrder: 12,
        defaultMonthlyBudget: "150.00",
      },
      {
        name: "Dining",
        kind: "expense",
        color: "#9333ea",
        sortOrder: 13,
        defaultMonthlyBudget: "200.00",
      },
    ])
    .returning();

  const salary = categories.find((c) => c.name === "Salary")!;
  const rent = categories.find((c) => c.name === "Rent")!;
  const groceries = categories.find((c) => c.name === "Groceries")!;
  const transport = categories.find((c) => c.name === "Transport")!;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = String(now.getDate()).padStart(2, "0");
  const monthStr = String(month).padStart(2, "0");
  const today = `${year}-${monthStr}-${day}`;

  await db.insert(schema.monthlyBudgets).values([
    { categoryId: rent.id, year, month, plannedAmount: "1200.00" },
    { categoryId: groceries.id, year, month, plannedAmount: "400.00" },
    { categoryId: transport.id, year, month, plannedAmount: "150.00" },
  ]);

  await db.insert(schema.transactions).values([
    {
      categoryId: salary.id,
      name: "Monthly salary",
      amount: "4200.00",
      currency: "USD",
      description: "Monthly salary",
      transactionDate: `${year}-${monthStr}-01`,
    },
    {
      categoryId: rent.id,
      name: "Apartment rent",
      amount: "1200.00",
      currency: "USD",
      description: "Apartment rent",
      transactionDate: `${year}-${monthStr}-03`,
    },
    {
      categoryId: groceries.id,
      name: "Weekly groceries",
      amount: "86.42",
      currency: "USD",
      description: "Weekly groceries",
      transactionDate: today,
    },
    {
      categoryId: transport.id,
      name: "Transit pass",
      amount: "42.00",
      currency: "USD",
      description: "Transit pass",
      transactionDate: today,
    },
  ]);

  console.log("Seed complete.");
  console.log(`Categories: ${categories.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { getDb, schema } from "../src/db";

async function main() {
  const db = getDb();

  const existing = await db.query.accounts.findFirst();
  if (existing) {
    console.log("Seed skipped: accounts already exist.");
    return;
  }

  const [checking, savings] = await db
    .insert(schema.accounts)
    .values([
      {
        name: "Main checking",
        type: "checking",
        currency: "USD",
        initialBalance: "2500.00",
      },
      {
        name: "Emergency savings",
        type: "savings",
        currency: "USD",
        initialBalance: "8000.00",
      },
    ])
    .returning();

  const categories = await db
    .insert(schema.categories)
    .values([
      { name: "Salary", kind: "income", color: "#16a34a", sortOrder: 1 },
      { name: "Freelance", kind: "income", color: "#059669", sortOrder: 2 },
      { name: "Rent", kind: "expense", color: "#dc2626", sortOrder: 10 },
      { name: "Groceries", kind: "expense", color: "#ea580c", sortOrder: 11 },
      { name: "Transport", kind: "expense", color: "#2563eb", sortOrder: 12 },
      { name: "Dining", kind: "expense", color: "#9333ea", sortOrder: 13 },
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
      accountId: checking.id,
      categoryId: salary.id,
      amount: "4200.00",
      description: "Monthly salary",
      transactionDate: `${year}-${monthStr}-01`,
    },
    {
      accountId: checking.id,
      categoryId: rent.id,
      amount: "-1200.00",
      description: "Apartment rent",
      transactionDate: `${year}-${monthStr}-03`,
    },
    {
      accountId: checking.id,
      categoryId: groceries.id,
      amount: "-86.42",
      description: "Weekly groceries",
      transactionDate: today,
    },
    {
      accountId: checking.id,
      categoryId: transport.id,
      amount: "-42.00",
      description: "Transit pass",
      transactionDate: today,
    },
    {
      accountId: savings.id,
      categoryId: salary.id,
      amount: "500.00",
      description: "Transfer to savings",
      transactionDate: today,
    },
  ]);

  console.log("Seed complete.");
  console.log(`Accounts: ${checking.name}, ${savings.name}`);
  console.log(`Categories: ${categories.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

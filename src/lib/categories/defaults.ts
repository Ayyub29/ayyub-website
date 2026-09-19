export type DefaultCategory = {
  name: string;
  kind: "income" | "expense";
  color: string;
  sortOrder: number;
};

/** Only these categories should exist in personal money management. */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Salary", kind: "income", color: "#16a34a", sortOrder: 0 },
  { name: "Others", kind: "income", color: "#22c55e", sortOrder: 1 },
  { name: "Apartment", kind: "expense", color: "#dc2626", sortOrder: 10 },
  { name: "Utility Bill", kind: "expense", color: "#ea580c", sortOrder: 11 },
  { name: "Transportation", kind: "expense", color: "#2563eb", sortOrder: 12 },
  { name: "Food", kind: "expense", color: "#15803d", sortOrder: 13 },
  { name: "Drinkable Water", kind: "expense", color: "#0891b2", sortOrder: 14 },
  { name: "Daily Needs", kind: "expense", color: "#7c3aed", sortOrder: 15 },
  {
    name: "Breakfast & Snacks",
    kind: "expense",
    color: "#db2777",
    sortOrder: 16,
  },
  { name: "Entertainment", kind: "expense", color: "#9333ea", sortOrder: 17 },
  {
    name: "Productivity & Learning",
    kind: "expense",
    color: "#4f46e5",
    sortOrder: 18,
  },
  { name: "Liquid Saving", kind: "expense", color: "#059669", sortOrder: 19 },
  { name: "Others", kind: "expense", color: "#64748b", sortOrder: 20 },
  { name: "Goal", kind: "expense", color: "#0d9488", sortOrder: 21 },
  { name: "Investment", kind: "expense", color: "#ca8a04", sortOrder: 22 },
];

export function isDefaultCategory(name: string, kind: "income" | "expense") {
  return DEFAULT_CATEGORIES.some((c) => c.name === name && c.kind === kind);
}

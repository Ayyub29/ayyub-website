export type DefaultCategory = {
  name: string;
  kind: "income" | "expense";
  color: string;
  sortOrder: number;
};

/** Personal money management categories (matches your spreadsheet). */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Apartment", kind: "expense", color: "#dc2626", sortOrder: 1 },
  { name: "Utility Bill", kind: "expense", color: "#ea580c", sortOrder: 2 },
  { name: "Transportation", kind: "expense", color: "#2563eb", sortOrder: 3 },
  { name: "Food", kind: "expense", color: "#16a34a", sortOrder: 4 },
  { name: "Drinkable Water", kind: "expense", color: "#0891b2", sortOrder: 5 },
  { name: "Daily Needs", kind: "expense", color: "#7c3aed", sortOrder: 6 },
  {
    name: "Breakfast & Snacks",
    kind: "expense",
    color: "#db2777",
    sortOrder: 7,
  },
  { name: "Entertainment", kind: "expense", color: "#9333ea", sortOrder: 8 },
  {
    name: "Productivity & Learning",
    kind: "expense",
    color: "#4f46e5",
    sortOrder: 9,
  },
  { name: "Liquid Saving", kind: "expense", color: "#059669", sortOrder: 10 },
  { name: "Others", kind: "expense", color: "#64748b", sortOrder: 11 },
  { name: "Goal", kind: "expense", color: "#0d9488", sortOrder: 12 },
  { name: "Investment", kind: "expense", color: "#ca8a04", sortOrder: 13 },
];

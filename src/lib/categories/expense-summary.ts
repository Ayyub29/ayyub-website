/** Expense categories excluded from "living" / day-to-day expense totals. */
export const SUMMARY_EXCLUDED_EXPENSE_CATEGORY_NAMES = [
  "Goal",
  "Investment",
] as const;

export function isExcludedFromSummaryExpense(categoryName: string) {
  return (
    SUMMARY_EXCLUDED_EXPENSE_CATEGORY_NAMES as readonly string[]
  ).includes(categoryName);
}

import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

export const transactionInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.enum(SUPPORTED_CURRENCIES),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  categoryId: z.string().uuid("Pick a category"),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  defaultMonthlyBudget: z.coerce.number().min(0).optional(),
});

export const categoryBudgetDefaultSchema = z.object({
  categoryId: z.string().uuid(),
  defaultMonthlyBudget: z.coerce.number().min(0),
});

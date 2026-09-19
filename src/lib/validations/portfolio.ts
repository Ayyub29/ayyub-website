import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_TX_TYPES,
} from "@/lib/portfolio/constants";

const baseSchema = z.object({
  type: z.enum(PORTFOLIO_TX_TYPES),
  applicationId: z.string().uuid("Pick an application"),
  name: z.string().trim().max(200),
  value: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
  transactionAmount: z.coerce
    .number()
    .positive("Transaction amount must be greater than zero"),
  currency: z.enum(SUPPORTED_CURRENCIES),
  category: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.enum(PORTFOLIO_CATEGORIES).optional(),
  ),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export const portfolioTransactionInputSchema = baseSchema.superRefine(
  (data, ctx) => {
    const isTrade = data.type === "buy" || data.type === "sell";
    const isCash = data.type === "deposit" || data.type === "draw";

    if (isTrade) {
      if (!data.category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required for buy and sell",
          path: ["category"],
        });
      }
      if (data.value == null || data.value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value (units) is required for buy and sell",
          path: ["value"],
        });
      }
      if (!data.name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Name is required for buy and sell",
          path: ["name"],
        });
      }
    }

  },
);

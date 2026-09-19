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

export const portfolioApplicationInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  sortOrder: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(9999).optional(),
  ),
});

export const portfolioApplicationUpdateSchema =
  portfolioApplicationInputSchema.extend({
    id: z.string().uuid(),
  });

export const portfolioManualDividendSchema = z.object({
  applicationId: z.string().uuid(),
  category: z.enum(["p2p", "obligasi", "crypto"]),
  name: z.string().trim().min(1).max(200),
  annualAmount: z.coerce.number().positive("Annual amount must be greater than zero"),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

const portfolioTransactionBaseRefined = baseSchema.superRefine(
  (data, ctx) => {
    const isTrade = data.type === "buy" || data.type === "sell";

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

export const portfolioTransactionInputSchema = portfolioTransactionBaseRefined;

export const portfolioTransactionUpdateSchema =
  baseSchema
    .extend({
      id: z.string().uuid(),
    })
    .superRefine((data, ctx) => {
      const isTrade = data.type === "buy" || data.type === "sell";

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
    });

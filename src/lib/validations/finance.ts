import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { THRESHOLD_KEYS } from "@/lib/finance/health-thresholds.constants";

export const liabilityInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  kind: z.enum(["mortgage", "other"]),
  balance: z.coerce.number().min(0),
  annualPayment: z.coerce.number().min(0),
  currency: z.enum(SUPPORTED_CURRENCIES),
  sortOrder: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(9999).optional(),
  ),
});

export const liabilityUpdateSchema = liabilityInputSchema.extend({
  id: z.string().uuid(),
});

const thresholdField = z.coerce.number();

export const financeHealthThresholdsSchema = z.object(
  Object.fromEntries(
    THRESHOLD_KEYS.map((key) => [key, thresholdField]),
  ) as Record<(typeof THRESHOLD_KEYS)[number], typeof thresholdField>,
);

"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createFinancialLiability,
  type FinanceActionResult,
} from "@/app/(app)/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

const initialState: FinanceActionResult | null = null;

const empty = {
  name: "",
  kind: "other" as "mortgage" | "other",
  balance: "",
  annualPayment: "",
  currency: DEFAULT_CURRENCY,
  sortOrder: "",
};

export function LiabilityCreateForm() {
  const [fields, setFields] = useState(empty);
  const [state, formAction, pending] = useActionState(
    createFinancialLiability,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setFields(empty);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="liability-name">Name</Label>
          <Input
            id="liability-name"
            name="name"
            value={fields.name}
            onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="liability-kind">Type</Label>
          <select
            id="liability-kind"
            name="kind"
            value={fields.kind}
            onChange={(e) =>
              setFields((p) => ({
                ...p,
                kind: e.target.value as "mortgage" | "other",
              }))
            }
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            <option value="other">Non-mortgage</option>
            <option value="mortgage">Mortgage / hipotek</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="liability-currency">Currency</Label>
          <select
            id="liability-currency"
            name="currency"
            value={fields.currency}
            onChange={(e) =>
              setFields((p) => ({
                ...p,
                currency: e.target.value as SupportedCurrency,
              }))
            }
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="liability-balance">Outstanding balance</Label>
          <Input
            id="liability-balance"
            name="balance"
            type="number"
            min="0"
            step="0.01"
            value={fields.balance}
            onChange={(e) =>
              setFields((p) => ({ ...p, balance: e.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="liability-annual">Annual payment</Label>
          <Input
            id="liability-annual"
            name="annualPayment"
            type="number"
            min="0"
            step="0.01"
            value={fields.annualPayment}
            onChange={(e) =>
              setFields((p) => ({ ...p, annualPayment: e.target.value }))
            }
            required
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add liability"}
      </Button>
    </form>
  );
}

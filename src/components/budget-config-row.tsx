"use client";

import { useActionState } from "react";

import {
  updateCategoryDefaultBudget,
  type ActionResult,
} from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BudgetConfigRowProps = {
  categoryId: string;
  categoryName: string;
  /** Budget amount converted to the current display currency */
  displayAmount: string;
  displayCurrency: string;
  /** Original stored amount and currency (for reference) */
  storedAmount: string | null;
  storedCurrency: string | null;
};

const initialState: ActionResult | null = null;

export function BudgetConfigRow({
  categoryId,
  categoryName,
  displayAmount,
  displayCurrency,
  storedAmount,
  storedCurrency,
}: BudgetConfigRowProps) {
  const [state, formAction, pending] = useActionState(
    updateCategoryDefaultBudget,
    initialState,
  );

  const showStoredHint =
    storedAmount &&
    storedCurrency &&
    storedCurrency !== displayCurrency;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end">
      <div className="min-w-[10rem] flex-1">
        <p className="font-medium">{categoryName}</p>
        <p className="text-xs text-muted-foreground">Monthly budget limit</p>
        {showStoredHint ? (
          <p className="text-xs text-muted-foreground">
            Stored: {storedAmount} {storedCurrency}
          </p>
        ) : null}
      </div>

      <form action={formAction} className="flex flex-1 items-end gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">
            Amount ({displayCurrency})
          </label>
          <Input
            key={`default-${categoryId}-${displayCurrency}-${displayAmount}`}
            name="defaultMonthlyBudget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={displayAmount}
            placeholder="0"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
      </form>

      {state && !state.ok ? (
        <p className="text-xs text-destructive sm:col-span-2">{state.error}</p>
      ) : null}
    </div>
  );
}

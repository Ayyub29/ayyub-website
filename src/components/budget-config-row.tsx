"use client";

import { useActionState } from "react";

import {
  updateCategoryDefaultBudget,
  upsertMonthlyBudget,
  type ActionResult,
} from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BudgetConfigRowProps = {
  categoryId: string;
  categoryName: string;
  defaultBudget: string | null;
  monthBudget: string | null;
  year: number;
  month: number;
};

const initialState: ActionResult | null = null;

export function BudgetConfigRow({
  categoryId,
  categoryName,
  defaultBudget,
  monthBudget,
  year,
  month,
}: BudgetConfigRowProps) {
  const [monthState, monthAction, monthPending] = useActionState(
    upsertMonthlyBudget,
    initialState,
  );
  const [defaultState, defaultAction, defaultPending] = useActionState(
    updateCategoryDefaultBudget,
    initialState,
  );

  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_1fr]">
      <div>
        <p className="font-medium">{categoryName}</p>
        <p className="text-xs text-muted-foreground">Expense category</p>
      </div>

      <form action={defaultAction} className="flex items-end gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Default / month</label>
          <Input
            key={`default-${categoryId}-${defaultBudget ?? ""}`}
            name="defaultMonthlyBudget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultBudget ?? ""}
            placeholder="0"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={defaultPending}>
          Save
        </Button>
        {defaultState && !defaultState.ok ? (
          <span className="text-xs text-destructive">{defaultState.error}</span>
        ) : null}
      </form>

      <form action={monthAction} className="flex items-end gap-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">
            Override this month
          </label>
          <Input
            key={`month-${categoryId}-${year}-${month}-${monthBudget ?? defaultBudget ?? ""}`}
            name="plannedAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={monthBudget ?? defaultBudget ?? ""}
            placeholder="0"
          />
        </div>
        <Button type="submit" size="sm" disabled={monthPending}>
          Save
        </Button>
        {monthState && !monthState.ok ? (
          <span className="text-xs text-destructive">{monthState.error}</span>
        ) : null}
      </form>
    </div>
  );
}

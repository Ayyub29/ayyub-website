"use client";

import { useActionState } from "react";

import { createCategory, type ActionResult } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: ActionResult | null = null;

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(
    createCategory,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-name">Name</Label>
          <Input id="category-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-kind">Type</Label>
          <select
            id="category-kind"
            name="kind"
            defaultValue="expense"
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultMonthlyBudget">Default monthly budget</Label>
          <Input
            id="defaultMonthlyBudget"
            name="defaultMonthlyBudget"
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional (expense categories)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" type="color" defaultValue="#64748b" />
        </div>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">Category added.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        Add category
      </Button>
    </form>
  );
}

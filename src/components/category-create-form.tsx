"use client";

import { useActionState, useEffect, useState } from "react";

import { createCategory, type ActionResult } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: ActionResult | null = null;

type CategoryKind = "income" | "expense";

const emptyFields: {
  name: string;
  kind: CategoryKind;
  color: string;
  defaultMonthlyBudget: string;
} = {
  name: "",
  kind: "expense",
  color: "#64748b",
  defaultMonthlyBudget: "",
};

export function CategoryCreateForm() {
  const [fields, setFields] = useState(emptyFields);
  const [state, formAction, pending] = useActionState(
    createCategory,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setFields(emptyFields);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-category-name">Name</Label>
          <Input
            id="new-category-name"
            name="name"
            value={fields.name}
            onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-category-kind">Type</Label>
          <select
            id="new-category-kind"
            name="kind"
            value={fields.kind}
            onChange={(e) =>
              setFields((p) => ({
                ...p,
                kind: e.target.value as CategoryKind,
              }))
            }
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-category-budget">Monthly budget</Label>
          <Input
            id="new-category-budget"
            name="defaultMonthlyBudget"
            type="number"
            min="0"
            step="0.01"
            value={fields.defaultMonthlyBudget}
            onChange={(e) =>
              setFields((p) => ({ ...p, defaultMonthlyBudget: e.target.value }))
            }
            placeholder={fields.kind === "expense" ? "Optional" : "N/A for income"}
            disabled={fields.kind === "income"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-category-color">Color</Label>
          <Input
            id="new-category-color"
            name="color"
            type="color"
            value={fields.color}
            onChange={(e) => setFields((p) => ({ ...p, color: e.target.value }))}
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">Category created.</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add category"}
      </Button>
    </form>
  );
}

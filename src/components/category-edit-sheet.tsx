"use client";

import { useActionState, useEffect, useState } from "react";

import { updateCategory, type ActionResult } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type CategoryEditSheetProps = {
  category: {
    id: string;
    name: string;
    kind: "income" | "expense";
    color: string | null;
    defaultMonthlyBudget: string | null;
  };
};

const initialState: ActionResult | null = null;

export function CategoryEditSheet({ category }: CategoryEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    name: category.name,
    kind: category.kind,
    color: category.color ?? "#64748b",
    defaultMonthlyBudget: category.defaultMonthlyBudget ?? "",
  });
  const [state, formAction, pending] = useActionState(
    updateCategory,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (open) {
      setFields({
        name: category.name,
        kind: category.kind,
        color: category.color ?? "#64748b",
        defaultMonthlyBudget: category.defaultMonthlyBudget ?? "",
      });
    }
  }, [open, category]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        }
      />
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit category</SheetTitle>
          <SheetDescription>Update name, type, color, or budget.</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4 px-4 pb-6">
          <input type="hidden" name="id" value={category.id} />

          <div className="space-y-2">
            <Label htmlFor={`edit-name-${category.id}`}>Name</Label>
            <Input
              id={`edit-name-${category.id}`}
              name="name"
              value={fields.name}
              onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-kind-${category.id}`}>Type</Label>
            <select
              id={`edit-kind-${category.id}`}
              name="kind"
              value={fields.kind}
              onChange={(e) =>
                setFields((p) => ({
                  ...p,
                  kind: e.target.value as "income" | "expense",
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
            <Label htmlFor={`edit-budget-${category.id}`}>Monthly budget</Label>
            <Input
              id={`edit-budget-${category.id}`}
              name="defaultMonthlyBudget"
              type="number"
              min="0"
              step="0.01"
              value={fields.defaultMonthlyBudget}
              onChange={(e) =>
                setFields((p) => ({ ...p, defaultMonthlyBudget: e.target.value }))
              }
              disabled={fields.kind === "income"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-color-${category.id}`}>Color</Label>
            <Input
              id={`edit-color-${category.id}`}
              name="color"
              type="color"
              value={fields.color}
              onChange={(e) => setFields((p) => ({ ...p, color: e.target.value }))}
            />
          </div>

          {state && !state.ok ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

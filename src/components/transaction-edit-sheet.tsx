"use client";

import { useActionState, useEffect, useState } from "react";

import { updateTransaction, type ActionResult } from "@/app/(app)/money/actions";
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
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

export type TransactionEditRow = {
  id: string;
  name: string;
  amount: string;
  currency: string;
  transactionDate: string;
  categoryId: string;
};

type TransactionEditSheetProps = {
  transaction: TransactionEditRow;
  categories: CategoryOption[];
};

const initialState: ActionResult | null = null;

export function TransactionEditSheet({
  transaction,
  categories,
}: TransactionEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    name: transaction.name,
    amount: transaction.amount,
    currency: transaction.currency as SupportedCurrency,
    transactionDate: transaction.transactionDate,
    categoryId: transaction.categoryId,
  });
  const [state, formAction, pending] = useActionState(
    updateTransaction,
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
        name: transaction.name,
        amount: transaction.amount,
        currency: transaction.currency as SupportedCurrency,
        transactionDate: transaction.transactionDate,
        categoryId: transaction.categoryId,
      });
    }
  }, [open, transaction]);

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
          <SheetTitle>Edit transaction</SheetTitle>
          <SheetDescription>
            Update name, amount, currency, date, or category.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4 px-4 pb-6">
          <input type="hidden" name="id" value={transaction.id} />

          <div className="space-y-2">
            <Label htmlFor={`edit-tx-name-${transaction.id}`}>Name</Label>
            <Input
              id={`edit-tx-name-${transaction.id}`}
              name="name"
              value={fields.name}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-tx-amount-${transaction.id}`}>Value</Label>
              <Input
                id={`edit-tx-amount-${transaction.id}`}
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={fields.amount}
                onChange={(event) =>
                  setFields((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-tx-currency-${transaction.id}`}>
                Currency
              </Label>
              <select
                id={`edit-tx-currency-${transaction.id}`}
                name="currency"
                value={fields.currency}
                onChange={(event) =>
                  setFields((prev) => ({
                    ...prev,
                    currency: event.target.value as SupportedCurrency,
                  }))
                }
                className={cn(
                  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                )}
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-tx-date-${transaction.id}`}>Date</Label>
            <Input
              id={`edit-tx-date-${transaction.id}`}
              name="transactionDate"
              type="date"
              value={fields.transactionDate}
              onChange={(event) =>
                setFields((prev) => ({
                  ...prev,
                  transactionDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-tx-category-${transaction.id}`}>
              Category
            </Label>
            <select
              id={`edit-tx-category-${transaction.id}`}
              name="categoryId"
              value={fields.categoryId}
              onChange={(event) =>
                setFields((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              className={cn(
                "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              )}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.kind})
                </option>
              ))}
            </select>
          </div>

          {state && !state.ok ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";

import { createTransaction, type ActionResult } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

type TransactionFormProps = {
  categories: CategoryOption[];
  defaultDate: string;
};

const initialState: ActionResult | null = null;

function emptyForm(defaultDate: string) {
  return {
    name: "",
    amount: "",
    currency: DEFAULT_CURRENCY,
    transactionDate: defaultDate,
    categoryId: "",
  };
}

export function TransactionForm({
  categories,
  defaultDate,
}: TransactionFormProps) {
  const [fields, setFields] = useState(() => emptyForm(defaultDate));
  const [state, formAction, pending] = useActionState(
    createTransaction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setFields(emptyForm(defaultDate));
    }
  }, [state, defaultDate]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={fields.name}
            onChange={(event) =>
              setFields((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Coffee, salary, rent..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Value</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={fields.amount}
            onChange={(event) =>
              setFields((prev) => ({ ...prev, amount: event.target.value }))
            }
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
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
        <div className="space-y-2">
          <Label htmlFor="transactionDate">Date</Label>
          <Input
            id="transactionDate"
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
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={fields.categoryId}
            onChange={(event) =>
              setFields((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.kind})
              </option>
            ))}
          </select>
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">Transaction saved.</p>
      ) : null}

      <Button type="submit" disabled={pending || !fields.categoryId}>
        {pending ? "Saving..." : "Add transaction"}
      </Button>
    </form>
  );
}

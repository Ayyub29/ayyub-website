"use client";

import { useActionState, useEffect, useState } from "react";

import {
  updateFinancialLiability,
  type FinanceActionResult,
} from "@/app/(app)/finance/actions";
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

type LiabilityEditSheetProps = {
  liability: {
    id: string;
    name: string;
    kind: "mortgage" | "other";
    balance: string;
    annualPayment: string;
    currency: string;
    sortOrder: number;
  };
};

const initialState: FinanceActionResult | null = null;

export function LiabilityEditSheet({ liability }: LiabilityEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateFinancialLiability,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state]);

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
          <SheetTitle>Edit liability</SheetTitle>
          <SheetDescription>Balance sheet & repayment ratios</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4 px-4 pb-6">
          <input type="hidden" name="id" value={liability.id} />

          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" defaultValue={liability.name} required />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <select
              name="kind"
              defaultValue={liability.kind}
              className={cn(
                "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30",
              )}
            >
              <option value="other">Non-mortgage</option>
              <option value="mortgage">Mortgage</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <select
              name="currency"
              defaultValue={liability.currency}
              className={cn(
                "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30",
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
            <Label>Outstanding balance</Label>
            <Input
              name="balance"
              type="number"
              min="0"
              step="0.01"
              defaultValue={liability.balance}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Annual payment</Label>
            <Input
              name="annualPayment"
              type="number"
              min="0"
              step="0.01"
              defaultValue={liability.annualPayment}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={String(liability.sortOrder)}
            />
          </div>

          {state && !state.ok ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

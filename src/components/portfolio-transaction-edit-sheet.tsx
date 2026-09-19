"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  updatePortfolioTransaction,
  type PortfolioActionResult,
} from "@/app/(app)/portfolio/actions";
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
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CATEGORY_LABELS,
  PORTFOLIO_TX_TYPES,
  PORTFOLIO_TX_TYPE_LABELS,
  type PortfolioCategory,
  type PortfolioTxType,
} from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

type ApplicationOption = { id: string; name: string };

export type PortfolioTransactionEditRow = {
  id: string;
  type: PortfolioTxType;
  applicationId: string;
  name: string;
  value: string;
  transactionAmount: string;
  currency: string;
  category: PortfolioCategory | null;
  description: string | null;
  transactionDate: string;
};

type PortfolioTransactionEditSheetProps = {
  transaction: PortfolioTransactionEditRow;
  applications: ApplicationOption[];
};

const initialState: PortfolioActionResult | null = null;

function formatUnitsForInput(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return "";
  }
  if (n === 0) {
    return "";
  }
  return String(n);
}

export function PortfolioTransactionEditSheet({
  transaction,
  applications,
}: PortfolioTransactionEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    type: transaction.type,
    applicationId: transaction.applicationId,
    name: transaction.name,
    value: formatUnitsForInput(transaction.value),
    transactionAmount: transaction.transactionAmount,
    currency: transaction.currency as SupportedCurrency,
    category: transaction.category ?? "",
    description: transaction.description ?? "",
    transactionDate: transaction.transactionDate,
  });
  const [state, formAction, pending] = useActionState(
    updatePortfolioTransaction,
    initialState,
  );

  const isTrade = fields.type === "buy" || fields.type === "sell";

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (open) {
      setFields({
        type: transaction.type,
        applicationId: transaction.applicationId,
        name: transaction.name,
        value: formatUnitsForInput(transaction.value),
        transactionAmount: transaction.transactionAmount,
        currency: transaction.currency as SupportedCurrency,
        category: transaction.category ?? "",
        description: transaction.description ?? "",
        transactionDate: transaction.transactionDate,
      });
    }
  }, [open, transaction]);

  const namePlaceholder = useMemo(() => {
    if (isTrade) {
      return "BBCA, BTC, SBN0123-T4…";
    }
    if (fields.type === "deposit") {
      return "Optional — e.g. Top up";
    }
    return "Optional — e.g. Withdraw to bank";
  }, [fields.type, isTrade]);

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
          <SheetTitle>Edit portfolio entry</SheetTitle>
          <SheetDescription>
            Changes recalculate holdings and idle cash from the full log.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4 px-4 pb-6">
          <input type="hidden" name="id" value={transaction.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-ptx-type-${transaction.id}`}>Type</Label>
              <select
                id={`edit-ptx-type-${transaction.id}`}
                name="type"
                value={fields.type}
                onChange={(event) =>
                  setFields((prev) => ({
                    ...prev,
                    type: event.target.value as PortfolioTxType,
                  }))
                }
                className={cn(
                  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                )}
                required
              >
                {PORTFOLIO_TX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PORTFOLIO_TX_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-ptx-app-${transaction.id}`}>
                Application
              </Label>
              <select
                id={`edit-ptx-app-${transaction.id}`}
                name="applicationId"
                value={fields.applicationId}
                onChange={(event) =>
                  setFields((prev) => ({
                    ...prev,
                    applicationId: event.target.value,
                  }))
                }
                className={cn(
                  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                )}
                required
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-ptx-name-${transaction.id}`}>Name</Label>
            <Input
              id={`edit-ptx-name-${transaction.id}`}
              name="name"
              value={fields.name}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={namePlaceholder}
              required={isTrade}
            />
          </div>

          {isTrade ? (
            <div className="space-y-2">
              <Label htmlFor={`edit-ptx-value-${transaction.id}`}>
                Value (units / lots)
              </Label>
              <Input
                id={`edit-ptx-value-${transaction.id}`}
                name="value"
                type="number"
                min="0.0001"
                step="any"
                value={fields.value}
                onChange={(event) =>
                  setFields((prev) => ({ ...prev, value: event.target.value }))
                }
                required
              />
            </div>
          ) : (
            <input type="hidden" name="value" value="0" />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-ptx-amount-${transaction.id}`}>
                Transaction amount
              </Label>
              <Input
                id={`edit-ptx-amount-${transaction.id}`}
                name="transactionAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={fields.transactionAmount}
                onChange={(event) =>
                  setFields((prev) => ({
                    ...prev,
                    transactionAmount: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-ptx-currency-${transaction.id}`}>
                Currency
              </Label>
              <select
                id={`edit-ptx-currency-${transaction.id}`}
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
            <Label htmlFor={`edit-ptx-category-${transaction.id}`}>
              Category
            </Label>
            <select
              id={`edit-ptx-category-${transaction.id}`}
              name="category"
              value={fields.category}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, category: event.target.value }))
              }
              className={cn(
                "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              )}
              required={isTrade}
            >
              {!isTrade ? <option value="">—</option> : null}
              {PORTFOLIO_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {PORTFOLIO_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-ptx-date-${transaction.id}`}>Date</Label>
            <Input
              id={`edit-ptx-date-${transaction.id}`}
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
            <Label htmlFor={`edit-ptx-desc-${transaction.id}`}>
              Description
            </Label>
            <Input
              id={`edit-ptx-desc-${transaction.id}`}
              name="description"
              value={fields.description}
              onChange={(event) =>
                setFields((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
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

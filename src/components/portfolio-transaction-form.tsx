"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createPortfolioTransaction,
  type PortfolioActionResult,
} from "@/app/(app)/portfolio/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CATEGORY_LABELS,
  PORTFOLIO_TX_TYPES,
  PORTFOLIO_TX_TYPE_LABELS,
  type PortfolioTxType,
} from "@/lib/portfolio/constants";
import { cn } from "@/lib/utils";

type ApplicationOption = { id: string; name: string };

type PortfolioTransactionFormProps = {
  applications: ApplicationOption[];
  defaultDate: string;
};

const initialState: PortfolioActionResult | null = null;

function emptyForm(defaultDate: string) {
  return {
    type: "buy" as PortfolioTxType,
    applicationId: "",
    name: "",
    value: "",
    transactionAmount: "",
    currency: DEFAULT_CURRENCY,
    category: "stock",
    description: "",
    transactionDate: defaultDate,
  };
}

export function PortfolioTransactionForm({
  applications,
  defaultDate,
}: PortfolioTransactionFormProps) {
  const [fields, setFields] = useState(() => emptyForm(defaultDate));
  const [state, formAction, pending] = useActionState(
    createPortfolioTransaction,
    initialState,
  );

  const isTrade = fields.type === "buy" || fields.type === "sell";

  useEffect(() => {
    if (state?.ok) {
      setFields(emptyForm(defaultDate));
    }
  }, [state, defaultDate]);

  useEffect(() => {
    if (!fields.applicationId && applications[0]) {
      setFields((prev) => ({ ...prev, applicationId: applications[0].id }));
    }
  }, [applications, fields.applicationId]);

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
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
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
          <Label htmlFor="applicationId">Application</Label>
          <select
            id="applicationId"
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
            <option value="" disabled>
              Select app
            </option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
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
            <Label htmlFor="value">Value (units / lots)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0.0001"
              step="any"
              value={fields.value}
              onChange={(event) =>
                setFields((prev) => ({ ...prev, value: event.target.value }))
              }
              placeholder="3"
              required
            />
          </div>
        ) : (
          <input type="hidden" name="value" value="0" />
        )}

        <div className="space-y-2">
          <Label htmlFor="transactionAmount">Transaction amount</Label>
          <Input
            id="transactionAmount"
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
            placeholder="1000000"
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
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={fields.description}
            onChange={(event) =>
              setFields((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder="Coupon, notes…"
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add log entry"}
      </Button>
    </form>
  );
}

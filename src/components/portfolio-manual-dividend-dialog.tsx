"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  deletePortfolioManualDividend,
  upsertPortfolioManualDividend,
  type PortfolioActionResult,
} from "@/app/(app)/portfolio/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import type { ManualDividendHoldingOption } from "@/lib/portfolio/dividends";
import { PORTFOLIO_CATEGORY_LABELS } from "@/lib/portfolio/constants";

export type ManualDividendEditTarget = {
  applicationId: string;
  category: "p2p" | "obligasi" | "crypto";
  name: string;
  annualAmount: string;
  currency: SupportedCurrency;
};

type PortfolioManualDividendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdingOptions: ManualDividendHoldingOption[];
  editTarget?: ManualDividendEditTarget | null;
  /** Pre-select a holding when opening from a table row */
  initialPositionKey?: string;
};

const initialState: PortfolioActionResult | null = null;

function encodePosition(option: ManualDividendHoldingOption) {
  return `${option.applicationId}|${option.category}|${option.name}`;
}

export function PortfolioManualDividendDialog({
  open,
  onOpenChange,
  holdingOptions,
  editTarget,
  initialPositionKey,
}: PortfolioManualDividendDialogProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [annualAmount, setAnnualAmount] = useState("");
  const [currency, setCurrency] = useState<SupportedCurrency>("IDR");

  const [saveState, saveAction, savePending] = useActionState(
    upsertPortfolioManualDividend,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePortfolioManualDividend,
    initialState,
  );

  const selected = useMemo(
    () => holdingOptions.find((o) => encodePosition(o) === selectedKey),
    [holdingOptions, selectedKey],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    if (editTarget) {
      setSelectedKey(
        `${editTarget.applicationId}|${editTarget.category}|${editTarget.name}`,
      );
      setAnnualAmount(editTarget.annualAmount);
      setCurrency(editTarget.currency);
      return;
    }
    if (initialPositionKey) {
      setSelectedKey(initialPositionKey);
    } else {
      const firstUnset = holdingOptions.find((o) => !o.hasManual);
      setSelectedKey(firstUnset ? encodePosition(firstUnset) : "");
    }
    setAnnualAmount("");
    setCurrency("IDR");
  }, [open, editTarget, holdingOptions, initialPositionKey]);

  useEffect(() => {
    if (saveState?.ok || deleteState?.ok) {
      onOpenChange(false);
    }
  }, [saveState, deleteState, onOpenChange]);

  const isEdit = Boolean(editTarget);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit projected income" : "Add projected income"}
          </DialogTitle>
          <DialogDescription>
            Annual dividend, coupon, or other passive income for P2P, obligasi,
            or crypto holdings. IDX stocks use Yahoo Finance automatically.
          </DialogDescription>
        </DialogHeader>

        {holdingOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No non-stock holdings yet. Log a buy in P2P, obligasi, or crypto
            first.
          </p>
        ) : (
          <form action={saveAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="dividendHolding">Holding</Label>
              <select
                id="dividendHolding"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={selectedKey}
                disabled={isEdit}
                onChange={(event) => {
                  setSelectedKey(event.target.value);
                }}
                required
              >
                <option value="" disabled>
                  Select holding…
                </option>
                {holdingOptions.map((option) => (
                  <option
                    key={encodePosition(option)}
                    value={encodePosition(option)}
                  >
                    {option.label} ({PORTFOLIO_CATEGORY_LABELS[option.category]}
                    {option.hasManual ? " · saved" : ""})
                  </option>
                ))}
              </select>
            </div>

            {selected ? (
              <>
                <input
                  type="hidden"
                  name="applicationId"
                  value={selected.applicationId}
                />
                <input type="hidden" name="category" value={selected.category} />
                <input type="hidden" name="name" value={selected.name} />
              </>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="annualAmount">Annual income</Label>
                <Input
                  id="annualAmount"
                  name="annualAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={annualAmount}
                  onValueChange={setAnnualAmount}
                  placeholder="12000000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value as SupportedCurrency)
                  }
                >
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {saveState && !saveState.ok ? (
              <p className="text-sm text-destructive">{saveState.error}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={savePending || !selected}>
                {savePending ? "Saving…" : "Save"}
              </Button>
              {isEdit && selected ? (
                <Button
                  type="submit"
                  variant="outline"
                  disabled={deletePending}
                  formAction={deleteAction}
                >
                  {deletePending ? "Removing…" : "Remove manual income"}
                </Button>
              ) : null}
            </div>
          </form>
        )}

        {deleteState && !deleteState.ok ? (
          <p className="text-sm text-destructive">{deleteState.error}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

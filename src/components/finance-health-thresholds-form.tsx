"use client";

import { useActionState } from "react";

import {
  updateFinanceHealthThresholds,
  type FinanceActionResult,
} from "@/app/(app)/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  THRESHOLD_KEYS,
  THRESHOLD_LABELS,
  type FinanceHealthThresholds,
  type ThresholdKey,
} from "@/lib/finance/health-thresholds.constants";

function displayValue(key: ThresholdKey, value: number) {
  if (THRESHOLD_LABELS[key].unit === "months") {
    return String(value);
  }
  return String(Math.round(value * 1000) / 10);
}

function fieldName(key: ThresholdKey) {
  return key;
}

type FinanceHealthThresholdsFormProps = {
  thresholds: FinanceHealthThresholds;
};

const initialState: FinanceActionResult | null = null;

export function FinanceHealthThresholdsForm({
  thresholds,
}: FinanceHealthThresholdsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateFinanceHealthThresholds,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {THRESHOLD_KEYS.map((key) => {
          const meta = THRESHOLD_LABELS[key];
          const isPercent = meta.unit === "percent";
          return (
            <div key={key} className="space-y-1 rounded-lg border p-4">
              <Label htmlFor={key}>{meta.label}</Label>
              <p className="text-xs text-muted-foreground">{meta.hint}</p>
              <div className="flex items-center gap-2 pt-2">
                <Input
                  id={key}
                  name={fieldName(key)}
                  type="number"
                  step={isPercent ? "0.1" : "0.5"}
                  min="0"
                  defaultValue={displayValue(key, thresholds[key])}
                  required
                />
                <span className="text-sm text-muted-foreground">
                  {isPercent ? "%" : "mo"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save thresholds"}
      </Button>
    </form>
  );
}

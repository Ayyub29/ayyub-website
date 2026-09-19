"use client";

import { useActionState, useEffect, useState } from "react";

import {
  upsertMonthlyAccountBalances,
  type ActionResult,
} from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MonthlyBalanceFormProps = {
  year: number;
  month: number;
  idrDefault: string;
  thbDefault: string;
  /** Drop outer border/padding when embedded in a dialog */
  variant?: "default" | "plain";
  onSuccess?: () => void;
};

const initialState: ActionResult | null = null;

export function MonthlyBalanceForm({
  year,
  month,
  idrDefault,
  thbDefault,
  variant = "default",
  onSuccess,
}: MonthlyBalanceFormProps) {
  const [state, formAction, pending] = useActionState(
    upsertMonthlyAccountBalances,
    initialState,
  );
  const [idrBalance, setIdrBalance] = useState(idrDefault);
  const [thbBalance, setThbBalance] = useState(thbDefault);

  useEffect(() => {
    setIdrBalance(idrDefault);
    setThbBalance(thbDefault);
  }, [year, month, idrDefault, thbDefault]);

  useEffect(() => {
    if (state?.ok) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form
      action={formAction}
      className={
        variant === "plain"
          ? "flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
          : "flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end"
      }
    >
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <div className="min-w-[12rem] flex-1 space-y-1">
        <Label htmlFor="idrBalance">IDR account balance</Label>
        <Input
          id="idrBalance"
          name="idrBalance"
          type="number"
          min="0"
          step="1"
          required
          value={idrBalance}
          onValueChange={setIdrBalance}
          placeholder="0"
        />
      </div>

      <div className="min-w-[12rem] flex-1 space-y-1">
        <Label htmlFor="thbBalance">THB account balance</Label>
        <Input
          id="thbBalance"
          name="thbBalance"
          type="number"
          min="0"
          step="0.01"
          required
          value={thbBalance}
          onValueChange={setThbBalance}
          placeholder="0"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save balances"}
      </Button>

      {state && !state.ok ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

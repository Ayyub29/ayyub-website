"use client";

import { useEffect, useState } from "react";

import { MonthlyBalanceForm } from "@/components/monthly-balance-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonthYear } from "@/lib/format";

type MonthlyBalanceDialogProps = {
  year: number;
  month: number;
  idrDefault: string;
  thbDefault: string;
  /** Open the dialog on first render when balances are missing */
  promptWhenMissing: boolean;
};

export function MonthlyBalanceDialog({
  year,
  month,
  idrDefault,
  thbDefault,
  promptWhenMissing,
}: MonthlyBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompted, setPrompted] = useState(false);

  useEffect(() => {
    if (promptWhenMissing && !prompted) {
      setOpen(true);
      setPrompted(true);
    }
  }, [promptWhenMissing, prompted]);

  const periodLabel = formatMonthYear(year, month);

  return (
    <>
      <Button
        type="button"
        variant={promptWhenMissing ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {promptWhenMissing ? "Enter balances" : "Update balances"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End-of-month bank balances</DialogTitle>
            <DialogDescription>
              IDR and THB account totals for {periodLabel}. Used for saving
              rate and account overview until you save a newer month.
            </DialogDescription>
          </DialogHeader>
          <MonthlyBalanceForm
            year={year}
            month={month}
            idrDefault={idrDefault}
            thbDefault={thbDefault}
            variant="plain"
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

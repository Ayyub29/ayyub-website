"use client";

import { useActionState, useEffect, useState } from "react";

import {
  updatePortfolioApplication,
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

type PortfolioApplicationEditSheetProps = {
  application: {
    id: string;
    name: string;
    sortOrder: number;
  };
};

const initialState: PortfolioActionResult | null = null;

export function PortfolioApplicationEditSheet({
  application,
}: PortfolioApplicationEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({
    name: application.name,
    sortOrder: String(application.sortOrder),
  });
  const [state, formAction, pending] = useActionState(
    updatePortfolioApplication,
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
        name: application.name,
        sortOrder: String(application.sortOrder),
      });
    }
  }, [open, application]);

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
          <SheetTitle>Edit application</SheetTitle>
          <SheetDescription>
            Used in portfolio transaction logs and summaries.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-4 px-4 pb-6">
          <input type="hidden" name="id" value={application.id} />

          <div className="space-y-2">
            <Label htmlFor={`edit-app-name-${application.id}`}>Name</Label>
            <Input
              id={`edit-app-name-${application.id}`}
              name="name"
              value={fields.name}
              onChange={(e) =>
                setFields((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-app-sort-${application.id}`}>Sort order</Label>
            <Input
              id={`edit-app-sort-${application.id}`}
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              value={fields.sortOrder}
              onChange={(e) =>
                setFields((p) => ({ ...p, sortOrder: e.target.value }))
              }
              required
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

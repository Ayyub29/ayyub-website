"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createPortfolioApplication,
  type PortfolioActionResult,
} from "@/app/(app)/portfolio/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PortfolioActionResult | null = null;

const emptyFields = { name: "", sortOrder: "" };

export function PortfolioApplicationCreateForm() {
  const [fields, setFields] = useState(emptyFields);
  const [state, formAction, pending] = useActionState(
    createPortfolioApplication,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setFields(emptyFields);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-app-name">Name</Label>
          <Input
            id="new-app-name"
            name="name"
            value={fields.name}
            onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ajaib, Bibit, IBKR…"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-app-sort">Sort order</Label>
          <Input
            id="new-app-sort"
            name="sortOrder"
            type="number"
            min="0"
            step="1"
            value={fields.sortOrder}
            onChange={(e) =>
              setFields((p) => ({ ...p, sortOrder: e.target.value }))
            }
            placeholder="Auto if empty"
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add application"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";

import {
  deletePortfolioApplication,
  type PortfolioActionResult,
} from "@/app/(app)/portfolio/actions";
import { Button } from "@/components/ui/button";

type DeletePortfolioApplicationButtonProps = {
  id: string;
};

const initialState: PortfolioActionResult | null = null;

export function DeletePortfolioApplicationButton({
  id,
}: DeletePortfolioApplicationButtonProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: PortfolioActionResult | null, formData: FormData) =>
      deletePortfolioApplication(formData),
    initialState,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={pending}
        >
          Delete
        </Button>
      </form>
      {state && !state.ok ? (
        <p className="max-w-[14rem] text-right text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { deletePortfolioTransaction } from "@/app/(app)/portfolio/actions";
import { Button } from "@/components/ui/button";

async function deleteAction(formData: FormData) {
  await deletePortfolioTransaction(formData);
}

export function DeletePortfolioTransactionButton({ id }: { id: string }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Delete
      </Button>
    </form>
  );
}

"use client";

import { deleteFinancialLiability } from "@/app/(app)/finance/actions";
import { Button } from "@/components/ui/button";

async function deleteAction(formData: FormData) {
  await deleteFinancialLiability(formData);
}

export function DeleteLiabilityButton({ id }: { id: string }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Delete
      </Button>
    </form>
  );
}

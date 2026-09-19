"use client";

import { deleteTransaction } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";

async function deleteAction(formData: FormData) {
  await deleteTransaction(formData);
}

export function DeleteTransactionButton({ id }: { id: string }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Delete
      </Button>
    </form>
  );
}

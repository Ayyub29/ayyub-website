"use client";

import { useState } from "react";

import { deleteCategory, type ActionResult } from "@/app/(app)/money/actions";
import { Button } from "@/components/ui/button";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete category "${name}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    const result: ActionResult = await deleteCategory(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        disabled={pending}
        onClick={handleDelete}
      >
        {pending ? "..." : "Delete"}
      </Button>
      {error ? <span className="max-w-[12rem] text-right text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

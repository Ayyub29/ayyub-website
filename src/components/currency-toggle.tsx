"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setDisplayCurrency } from "@/app/(app)/settings/actions";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

type CurrencyToggleProps = {
  value: SupportedCurrency;
};

export function CurrencyToggle({ value }: CurrencyToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(currency: SupportedCurrency) {
    if (currency === value || pending) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("currency", currency);
      await setDisplayCurrency(formData);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border bg-background p-0.5",
        pending && "opacity-70",
      )}
      aria-label="Display currency"
    >
      {SUPPORTED_CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => onSelect(code)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

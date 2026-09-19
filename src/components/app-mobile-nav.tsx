"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { APP_NAV_ITEMS, isAppNavItemActive } from "@/lib/app-nav-config";
import { cn } from "@/lib/utils";

export function AppMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link
        href="/dashboard"
        className="hidden font-semibold tracking-tight sm:inline"
      >
        Ayyub Finance
      </Link>
      <button
        type="button"
        className="inline-flex items-center gap-2 font-semibold tracking-tight sm:hidden"
        aria-expanded={open}
        aria-controls="app-mobile-nav"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5 shrink-0 text-muted-foreground" />
        Ayyub Finance
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-[min(100%,18rem)] flex-col p-0"
          id="app-mobile-nav"
        >
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle>Ayyub Finance</SheetTitle>
            <SheetDescription>Personal finance</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 p-3">
            {APP_NAV_ITEMS.map((item) => {
              const isActive = isAppNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t p-4">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Go to Summary
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

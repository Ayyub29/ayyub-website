"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/accounts/overview", label: "Accounts" },
  { href: "/dashboard", label: "Summary" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard" ||
              pathname.startsWith("/dashboard/")
            : item.href === "/portfolio"
              ? pathname === "/portfolio" ||
                pathname.startsWith("/portfolio/")
              : item.href === "/accounts/overview"
                ? pathname === "/accounts" ||
                  pathname.startsWith("/accounts/")
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

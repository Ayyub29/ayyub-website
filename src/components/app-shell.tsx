import { signOut } from "@/auth";
import { AppMobileNav } from "@/components/app-mobile-nav";
import { AppNav } from "@/components/app-nav";
import { CurrencyToggle } from "@/components/currency-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SupportedCurrency } from "@/lib/currencies";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  displayCurrency: SupportedCurrency;
};

export function AppShell({
  children,
  userEmail,
  displayCurrency,
}: AppShellProps) {
  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
            <AppMobileNav />
            <AppNav />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <CurrencyToggle value={displayCurrency} />
            {userEmail ? (
              <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground lg:inline">
                {userEmail}
              </span>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="px-2.5 sm:px-3">
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <Separator className="mt-8" />
      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        Personal finance tracker — spreadsheet-style categories, budgets, and
        transactions.
      </footer>
    </div>
  );
}

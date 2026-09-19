import Link from "next/link";

import { signOut } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              Ayyub Finance
            </Link>
            <AppNav />
          </div>
          <div className="flex items-center gap-3">
            {userEmail ? (
              <span className="hidden text-sm text-muted-foreground md:inline">
                {userEmail}
              </span>
            ) : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign out
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

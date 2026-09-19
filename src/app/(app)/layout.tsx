import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { getDisplayCurrency } from "@/lib/currency/display-currency";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let displayCurrency = DEFAULT_CURRENCY;

  try {
    displayCurrency = await getDisplayCurrency();
  } catch {
    displayCurrency = DEFAULT_CURRENCY;
  }

  return (
    <AppShell userEmail={session?.user?.email} displayCurrency={displayCurrency}>
      {children}
    </AppShell>
  );
}

import { getDisplayMoney } from "@/lib/currency/server-display";
import { CurrencyToggle } from "@/components/currency-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsGeneralPage() {
  let money;
  try {
    money = await getDisplayMoney();
  } catch {
    money = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground">
          Display preferences for the whole app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Display currency</CardTitle>
          <CardDescription>
            All summaries, budgets, and converted amounts use this currency.
            Transaction values are still stored in the currency you enter; we
            convert them using live Google Finance rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {money ? (
            <>
              <CurrencyToggle value={money.displayCurrency} />
              <p className="text-xs text-muted-foreground">
                Rates source:{" "}
                {money.rateSource === "google"
                  ? "Google Finance"
                  : "Fallback (Google unavailable)"}{" "}
                · Updated {money.ratesUpdatedAt.toLocaleString()}
              </p>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Example: 100 USD →{" "}
                {money.formatConverted(100, "USD")} in your display currency.
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect the database to load exchange rates.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

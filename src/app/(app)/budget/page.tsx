import { redirect } from "next/navigation";

export default function LegacyBudgetPage() {
  redirect("/settings/budget");
}

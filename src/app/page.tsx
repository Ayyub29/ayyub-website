import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Personal finance
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Track spending, budgets, and accounts in one place.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Built to mirror spreadsheet-style workflows: categories, monthly
            budgets, transaction logs, and a simple dashboard.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Sign in to get started
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Transactions",
              description: "Date, payee, category, and amount — like your sheet log.",
            },
            {
              title: "Budget vs actual",
              description: "Monthly planned amounts per category with variance.",
            },
            {
              title: "Accounts",
              description: "Checking, savings, credit, and cash balances.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

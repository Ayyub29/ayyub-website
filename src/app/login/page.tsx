import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignInButton } from "@/components/sign-in-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use Google to access your personal finance workspace. Set{" "}
            <code className="text-xs">AUTH_ALLOWED_EMAIL</code> to restrict
            sign-in to your account only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton callbackUrl={callbackUrl ?? "/dashboard"} />
        </CardContent>
      </Card>
    </div>
  );
}

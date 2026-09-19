import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  callbackUrl?: string;
};

export function SignInButton({ callbackUrl = "/dashboard" }: SignInButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: callbackUrl });
      }}
    >
      <Button type="submit" size="lg">
        Continue with Google
      </Button>
    </form>
  );
}

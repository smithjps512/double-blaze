import Link from "next/link";
import { isClerkEnabled } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (!isClerkEnabled) {
    return <AuthDisabled action="Sign in" />;
  }
  const { SignIn } = await import("@clerk/nextjs");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <SignIn />
    </div>
  );
}

function AuthDisabled({ action }: { action: string }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">{action} is not enabled yet</h1>
      <p className="mt-3 max-w-md text-ink/70">
        Accounts open once the client and execution portals launch. In the
        meantime, start a project and we will be in touch.
      </p>
      <Link href="/start-a-project" className="btn-primary mt-6">
        Start a project
      </Link>
    </div>
  );
}

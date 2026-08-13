import Link from "next/link";
import { isClerkEnabled } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function SignUpPage() {
  if (!isClerkEnabled) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">
          Accounts are not open yet
        </h1>
        <p className="mt-3 max-w-md text-ink/70">
          Client accounts are created after purchase, once the portals launch.
        </p>
        <Link href="/start-a-project" className="btn-primary mt-6">
          Start a project
        </Link>
      </div>
    );
  }
  const { SignUp } = await import("@clerk/nextjs");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <SignUp />
    </div>
  );
}

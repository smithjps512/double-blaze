import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInForm";
import { safeNext } from "@/lib/auth-rules";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  expired: "That link expired or was already used. Send yourself a new one.",
  domain: "Only @mcps.org staff accounts can sign in.",
  signin: "Sign in did not finish. Send yourself a new link.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next: rawNext, error }, { viewer }] = await Promise.all([searchParams, getViewer()]);
  const next = safeNext(rawNext);
  if (viewer) redirect(next);

  return (
    <section className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <p className="inline-block -rotate-2 bg-tape px-3 py-1 font-stencil text-lg uppercase tracking-widest text-ink">
        Staff only
      </p>
      <h1 className="mt-4 font-display text-4xl font-extrabold">Show Your Interest Now!</h1>
      <p className="mt-3 text-muted">
        Enter your school email and we will send you a sign-in link. Two minutes, no payment, no commitment.
      </p>
      {error && ERRORS[error] && (
        <p role="alert" className="mt-6 rounded-xl bg-sold px-4 py-3 font-semibold text-chalk">
          {ERRORS[error]}
        </p>
      )}
      <div className="mt-8">
        <SignInForm next={next} />
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { SignInForm } from "@/components/SignInForm";
import { safeNext } from "@/lib/auth-rules";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  expired: "That link has expired or was already used. Send yourself a new one.",
  signin: "Sign in did not work. Send yourself a new link.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-center font-display text-4xl font-extrabold">Sign in to Find Me</h1>
      <p className="mt-2 text-center text-muted">Save your matches, contact shelters, and keep your pet&apos;s care plan.</p>
      {error && ERRORS[error] && (
        <p className="mt-6 rounded-xl bg-ember-light px-4 py-3 text-sm text-ember-dark" role="alert">
          {ERRORS[error]}
        </p>
      )}
      <div className="mt-6">
        <SignInForm next={safeNext(next)} />
      </div>
    </section>
  );
}

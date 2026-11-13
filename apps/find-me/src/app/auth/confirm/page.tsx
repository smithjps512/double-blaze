import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/auth-rules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/**
 * Where the emailed link lands. A button instead of signing in straight away,
 * because email scanners open links to check them and would otherwise spend
 * the one-time token before the person taps it.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-extrabold">One tap to sign in</h1>
      {token_hash ? (
        <form action="/auth/verify" method="post" className="mt-8">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type ?? "magiclink"} />
          <input type="hidden" name="next" value={safeNext(next)} />
          <button type="submit" className="btn-primary w-full py-4 text-lg">
            Sign me in
          </button>
        </form>
      ) : (
        <p className="mt-8">
          This link is missing a piece.{" "}
          <Link href="/sign-in" className="font-semibold underline underline-offset-4">
            Send yourself a new one
          </Link>
          .
        </p>
      )}
    </section>
  );
}

import type { Metadata } from "next";
import { safeNext } from "@/lib/auth-rules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/**
 * Where the emailed link lands. It shows a button instead of signing in
 * straight away, because school email scanners open links to check them and
 * would otherwise use up the one-time token before the person taps it.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash, type, next } = await searchParams;
  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="inline-block -rotate-2 bg-tape px-3 py-1 font-stencil text-lg uppercase tracking-widest text-ink">
        Almost there
      </p>
      <h1 className="mt-4 font-display text-4xl font-extrabold">One tap to sign in</h1>
      <p className="mt-3 text-muted">Then the survey opens.</p>
      {token_hash ? (
        <form action="/auth/verify" method="post" className="mt-8">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type ?? "magiclink"} />
          <input type="hidden" name="next" value={safeNext(next)} />
          <button
            type="submit"
            className="focus-ring w-full rounded-full bg-bms px-8 py-4 font-display text-xl font-extrabold text-tape shadow-sign transition hover:bg-bms-dark"
          >
            Sign me in
          </button>
        </form>
      ) : (
        <p className="mt-8">
          This link is missing a piece.{" "}
          <a href="/sign-in?next=/interest" className="font-semibold underline decoration-tape decoration-2 underline-offset-4">
            Send yourself a new one
          </a>
          .
        </p>
      )}
    </section>
  );
}

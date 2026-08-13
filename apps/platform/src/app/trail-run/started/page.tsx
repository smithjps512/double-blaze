import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You are in",
  robots: { index: false },
};

export default function TrailRunStartedPage() {
  return (
    <>
      <PageHero
        eyebrow="Trail Run"
        title="You are in. No charge yet."
        intro="We have your card on file and you have not been charged anything. Your 30-day window starts the day your solution goes live."
      />
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-ink">What happens next</h2>
            <ol className="mt-5 space-y-4 text-ink/75">
              <li>
                <span className="font-semibold text-ink">
                  1. Check your email.
                </span>{" "}
                We are sending a confirmation, then a separate invitation to set
                up your account.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  2. Set up your account.
                </span>{" "}
                The invitation link creates your secure login so we can capture
                what we need to build.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  3. We build it.
                </span>{" "}
                When it goes live, your 30-day window begins and we check in along
                the way with real results.
              </li>
            </ol>
            <Link href="/" className="btn-secondary mt-8">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

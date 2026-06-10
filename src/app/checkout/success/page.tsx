import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Purchase complete",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <PageHero
        eyebrow="Thank you"
        title="Your purchase is complete"
        intro="Welcome to Double Blaze. A confirmation email is on its way."
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
                We are sending a purchase confirmation, then a separate
                invitation to set up your client account.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  2. Set up your account.
                </span>{" "}
                The invitation link creates your secure login and lets you
                complete your organization profile.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  3. We get to work.
                </span>{" "}
                Once you are in, we kick off your project from your dashboard.
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

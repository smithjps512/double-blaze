import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { DISCOVERY_BOOKING_URL, INTAKE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a discovery call",
  description:
    "Pick a time for your free discovery call with the Double Blaze program management team.",
};

/**
 * Branded booking page. The scheduler itself is embedded, so swapping the
 * provider (Calendly today, a Double Blaze scheduler later) is a URL change.
 */
export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Free discovery call"
        title="Pick a time that works for you"
        intro="Thirty minutes with the program management group that fits your needs. No cost and no obligation, and the conversation becomes your proposal."
      />
      <section className="bg-stone-white">
        <div className="container-page grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-8">
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-stone-white">
              <iframe
                src={DISCOVERY_BOOKING_URL}
                title="Schedule your free discovery call"
                className="h-[720px] w-full"
                loading="lazy"
              />
            </div>
            <p className="mt-3 text-sm text-ink/60">
              Scheduler not loading?{" "}
              <a
                href={DISCOVERY_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-impact-orange hover:text-blaze-maroon"
              >
                Open it in a new tab
              </a>
              .
            </p>
          </div>
          <aside className="md:col-span-4">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">Get more out of the call</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Tell us about your needs first, and we will bring the right
                practice group to the call already up to speed.
              </p>
              <Link href={INTAKE_HREF} className="btn-secondary mt-5">
                Tell us your needs
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { INCLUDED_DELIVERABLES, PHASES } from "@/lib/practice";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "You pay for program management, priced by phase and by value, not by the hour. Software, designs, and content are included and yours, with unlimited users and hosting at cost.",
};

/**
 * How pricing works. Price points are deliberately absent until the pricing
 * strategy is settled; every engagement is quoted in its proposal.
 */
export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="How pricing works"
        title="You pay for program management. That is it."
        intro="We built our own tools to handle the production work, so we do not bill you for it. Software, designs, and content come with the program, and you own them."
      />

      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-6">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              What you pay for
            </h2>
            <p className="mt-4 text-ink/75">
              Program management: the planning, leadership, coordination, and
              accountability that get a program from idea to done, and keep it
              working after.
            </p>
            <p className="mt-4 text-ink/75">
              We price by value, not by the hour, so nobody is watching a clock.
              Each of the five phases is a defined item with a fixed price in
              your proposal. Buy one phase or all five.
            </p>
            <ol className="mt-6 flex flex-wrap gap-2">
              {PHASES.map((p) => (
                <li
                  key={p.n}
                  className="rounded-full border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {p.n}. {p.title}
                </li>
              ))}
            </ol>
          </div>
          <div className="md:col-span-6">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6 md:p-8">
              <h2 className="text-lg font-bold text-ink">Included, always</h2>
              <ul className="mt-5 grid gap-3 text-sm text-ink/80 sm:grid-cols-2">
                {INCLUDED_DELIVERABLES.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-ink/10 pt-4 text-xs leading-relaxed text-ink/60">
                Physical materials, fabrication, construction, and third-party
                services are quoted at cost in your proposal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">The fine print, in plain words</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Term title="You own the deliverables">
              What we build for you is yours. We keep the internal tools we use
              to build it. No license fees, no lock-in.
            </Term>
            <Term title="Unlimited users">
              Your whole organization can use what we build. We never charge per
              seat.
            </Term>
            <Term title="Hosting at our cost">
              Run it in your own environment, or in ours at exactly what it
              costs us. We show you the real numbers.
            </Term>
            <Term title="Changes after launch">
              Updates, maintenance, and additions are billed as program
              management, never as development.
            </Term>
          </div>
        </div>
      </section>

      <section className="bg-ridge-green text-stone-white">
        <div className="container-page py-14 md:py-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-white/70">
                Government buyers
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                A government menu with defined line items
              </h2>
              <p className="mt-3 max-w-2xl text-stone-white/85">
                Agencies and contractors get a dedicated version of our menu,
                built for procurement, with pricing no higher than we offer any
                commercial client.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Link
                href="/government"
                className="inline-flex items-center rounded-lg bg-trail-orange px-6 py-3 font-semibold text-stone-white transition hover:bg-impact-orange"
              >
                Working with government
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title="Get a proposal priced by phase"
        body="Start with a free discovery call. We will turn it into a proposal with a fixed price for each phase, before any work starts."
      />
    </>
  );
}

function Term({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{children}</p>
    </div>
  );
}

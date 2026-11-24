import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import {
  GOVERNMENT_DISCOUNT_PCT,
  INCLUDED_DELIVERABLES,
  PHASES,
  PRICE_TIERS,
  formatPrice,
} from "@/lib/practice";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "You pay for program management: fixed prices by phase in Starter, Growth, and Enterprise tiers, not by the hour. Software, designs, and content are included and yours, with unlimited users and hosting at cost.",
};

/**
 * How pricing works. Prices come from PRICE_TIERS in lib/practice.ts, the
 * menu James approved on 2026-11-24; every engagement is still confirmed in
 * its proposal.
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

      {/* The published menu */}
      <section className="border-t border-ink/10 bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">The menu</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              Fixed prices by phase, in three tiers
            </h2>
            <p className="mt-4 text-ink/75">
              Your tier depends on how complex the program is, never on how
              many people use what we build. Users are always unlimited.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PRICE_TIERS.map((tier) => (
              <div key={tier.slug} className="rounded-xl border border-ink/10 p-5">
                <h3 className="text-lg font-bold text-ink">{tier.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{tier.fit}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-ink/10">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Program management prices by phase and tier, in US dollars
              </caption>
              <thead className="bg-ink/[0.04] text-ink">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Phase</th>
                  {PRICE_TIERS.map((tier) => (
                    <th key={tier.slug} scope="col" className="px-4 py-3 text-right font-semibold">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-ink/80">
                {PHASES.slice(0, 4).map((phase, i) => (
                  <tr key={phase.n}>
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">
                      {phase.n}. {phase.title}
                    </th>
                    {PRICE_TIERS.map((tier) => (
                      <td key={tier.slug} className="px-4 py-3 text-right tabular-nums">
                        {tier.from && <span className="text-ink/55">from </span>}
                        {formatPrice(tier.phases[i])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-ridge-green/[0.06]">
                  <th scope="row" className="px-4 py-3 font-semibold text-ink">
                    5. {PHASES[4].title}
                  </th>
                  {PRICE_TIERS.map((tier) => (
                    <td key={tier.slug} className="px-4 py-3 text-right tabular-nums">
                      {tier.from && <span className="text-ink/55">from </span>}
                      {formatPrice(tier.monthly)}
                      <span className="text-ink/55"> / month</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-ink/60">
            Every deliverable is included at every tier. Adding a new feature
            later starts back at Discovery, discounted for clients on a
            retainer. Government buyers pay {GOVERNMENT_DISCOUNT_PCT}% less.
          </p>
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
                built for procurement: the same phases as defined line items, at
                our published commercial prices less {GOVERNMENT_DISCOUNT_PCT}%.
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

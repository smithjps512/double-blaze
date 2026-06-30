import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SERVICES } from "@/lib/content";
import { PLANS, formatUSD } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Sell, run, grow, and scale your business, all tied to your order to cash. National-brand depth at Main Street prices, by a veteran-owned team that lives here too.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell. Run. Grow. Scale."
        title="Everything between the first click and the money in the door"
        intro="Most of what slows a business down lives between the first click and the money in the door. We build that whole path, the selling, the running, the growing, and we tie all of it to one thing: your order to cash. National-brand depth, at Main Street prices, by people who live here too."
      />

      {/* The ladder: what the business gets, before the price. */}
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            The ladder
          </h2>
          <p className="mt-3 max-w-3xl text-ink/75">
            Four tiers, each tied to your order to cash, and each one adds what
            the tier below it does not.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <article
                key={plan.slug}
                className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-impact-orange">
                  {plan.verb}
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink">{plan.name}</h3>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-ink">
                    {formatUSD(plan.priceMonthly)}
                  </span>
                  <span className="text-ink/60">/mo</span>
                </p>
                <p className="mt-3 flex-1 text-sm text-ink/75">{plan.summary}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <p className="text-base font-semibold text-ink">
              Plans from $199 a month.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-primary">
                See full pricing
              </Link>
              <Link href="/trail-run" className="btn-secondary">
                Start free with Trail Run
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How we build it: capability cards as the secondary set. */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">How we build it</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              The work behind the ladder
            </h2>
            <p className="mt-4 text-ink/75">
              National-brand depth, applied to local problems, by neighbors who
              are invested in your success.
            </p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {SERVICES.map((service) => (
              <article
                key={service.slug}
                id={service.slug}
                className="scroll-mt-24 rounded-xl border border-ink/10 bg-stone-white p-8"
              >
                <h3 className="text-2xl font-bold text-ink">{service.title}</h3>
                <p className="mt-3 text-ink/70">{service.blurb}</p>
                {service.points.length > 0 && (
                  <ul className="mt-5 space-y-2.5 text-sm text-ink/75">
                    {service.points.map((point) => (
                      <li key={point} className="flex gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <p className="text-base font-semibold text-ink">
              Not sure where you fit?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/start-a-project" className="btn-primary">
                Book a free consultation
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

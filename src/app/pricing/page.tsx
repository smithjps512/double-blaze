import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import {
  PLANS,
  ALA_CARTE,
  MIN_TERM_MONTHS,
  formatUSD,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Four monthly plans from $199/mo and a-la-carte projects. Clear pricing, no enterprise bloat, built for small business.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Plans and pricing"
        title="Big-league technology, priced for local business"
        intro={`Plans from $199 a month, with the work and the upkeep bundled in. Prefer a one-time build? Pick from a-la-carte projects below. Monthly plans run on a ${MIN_TERM_MONTHS}-month partnership term.`}
      />

      {/* Trail Run offer: lead with the value, not a countdown. */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-14 md:py-16">
          <div className="grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-white/70">
                Trail Run
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Your first month is on us
              </h2>
              <p className="mt-3 max-w-2xl text-stone-white/85">
                We build it, you run it for 30 days, then you decide. Your window
                starts the day it goes live, not the day you sign up, so you get a
                full month of real results before you pay a thing. Stay if it
                earns it.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Link
                href="/trail-run"
                className="inline-flex items-center rounded-lg bg-trail-orange px-6 py-3 font-semibold text-stone-white transition hover:bg-impact-orange"
              >
                See how Trail Run works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly packages */}
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold text-ink">Monthly plans</h2>
          <p className="mt-2 text-ink/70">
            Each tier includes everything in the one before it.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <article
                key={plan.slug}
                className={`flex flex-col rounded-xl border bg-stone-white p-6 ${
                  plan.featured
                    ? "border-trail-orange ring-1 ring-trail-orange"
                    : "border-ink/10"
                }`}
              >
                {plan.featured && (
                  <p className="mb-3 inline-flex w-fit rounded-full bg-trail-orange px-3 py-1 text-xs font-semibold text-stone-white">
                    Most popular
                  </p>
                )}
                <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-ink/70">{plan.tagline}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold text-ink">
                    {formatUSD(plan.priceMonthly)}
                  </span>
                  <span className="text-ink/60">/mo</span>
                </p>
                {plan.adds && (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {plan.adds}
                  </p>
                )}
                <ul className="mt-3 flex-1 space-y-2 text-sm text-ink/75">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout/${plan.catalogKey}`}
                  className={
                    plan.featured ? "btn-primary mt-6" : "btn-secondary mt-6"
                  }
                >
                  Choose {plan.name}
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink/60">
            Monthly plans run on a {MIN_TERM_MONTHS}-month minimum term. You will
            confirm the term at checkout. Stripe Tax is applied where required.
          </p>
        </div>
      </section>

      {/* A-la-carte */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold text-ink">A-la-carte projects</h2>
          <p className="mt-2 text-ink/70">
            One-time builds for a specific need. Some include optional
            maintenance to keep things running.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {ALA_CARTE.map((item) => (
              <article
                key={item.slug}
                className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold text-ink">{item.name}</h3>
                  <p className="whitespace-nowrap text-xl font-bold text-ink">
                    {formatUSD(item.price)}
                  </p>
                </div>
                <p className="mt-3 flex-1 text-sm text-ink/70">
                  {item.description}
                </p>
                <p className="mt-4 text-xs font-medium text-ink/55">
                  One-time
                  {item.maintenanceMonthly
                    ? ` · ${formatUSD(item.maintenanceMonthly)}/mo maintenance`
                    : " · client hosted, no maintenance fee"}
                </p>
                <Link
                  href={`/checkout/${item.catalogKey}`}
                  className="btn-secondary mt-5"
                >
                  Get started
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-stone-white">
        <div className="container-page py-16 text-center">
          <h2 className="text-2xl font-bold text-ink">
            Not sure which plan fits?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/70">
            Tell us what you are working on. The first conversation is free, and
            it is with the people who will actually do the work.
          </p>
          <Link href="/start-a-project" className="btn-primary mt-6">
            Book a free consultation
          </Link>
        </div>
      </section>
    </>
  );
}

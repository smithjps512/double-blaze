import Link from "next/link";
import { SERVICES, SOLUTIONS, PROOF_POINTS, WHY_US } from "@/lib/content";
import { PLANS, formatUSD } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-blaze-maroon text-stone-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-impact-orange/30 to-transparent"
        />
        <div className="container-page relative grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-8 lg:col-span-7">
            <p className="eyebrow text-trail-orange/90">
              Veteran-owned digital partner
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              We mark the path for small businesses going digital.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-white/85">
              Websites, ecommerce, automation, and AI, built and run by a team
              that stays with you. One plan, one project lead, a clear trail
              from where you are to online and selling.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/start-a-project" className="btn-primary">
                Start a project
              </Link>
              <Link href="/pricing" className="btn-on-dark">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proof bar */}
      <section
        aria-label="At a glance"
        className="border-b border-ink/10 bg-stone-white"
      >
        <div className="container-page">
          <ul className="grid grid-cols-2 divide-ink/10 md:grid-cols-4 md:divide-x">
            {PROOF_POINTS.map((point) => (
              <li
                key={point}
                className="px-2 py-5 text-center text-sm font-semibold text-ink/80 md:px-4"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brand-idea band */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">The double blaze</p>
            <p className="mt-5 font-display text-2xl leading-snug text-ink sm:text-3xl">
              On a trail, a blaze is a painted mark that tells you you are still
              on the path. A double blaze means the path is about to turn. We
              are the marks on the trail for businesses making the turn toward
              digital, so you never have to guess the next step.
            </p>
          </div>
        </div>
      </section>

      {/* Four service cards */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">What we do</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Four ways we move your business forward
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <article
                key={service.slug}
                className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6"
              >
                <h3 className="text-lg font-bold text-ink">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {service.blurb}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-ink/70">
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/services"
              className="text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
            >
              See all services &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Three solution cards */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Where you are on the trail</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Solutions for every stage
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOLUTIONS.map((solution) => {
              const plan = PLANS.find(
                (p) => p.slug === solution.recommendedPlan,
              );
              return (
                <article
                  key={solution.slug}
                  className="flex flex-col rounded-xl border border-ink/10 bg-ridge-green p-7 text-stone-white"
                >
                  <h3 className="text-xl font-bold">{solution.title}</h3>
                  <p className="mt-2 text-sm font-medium text-stone-white/80">
                    {solution.outcome}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-stone-white/75">
                    {solution.blurb}
                  </p>
                  {plan && (
                    <p className="mt-6 text-sm font-semibold text-trail-orange">
                      Start on {plan.name} &middot; {formatUSD(plan.priceMonthly)}
                      /mo
                    </p>
                  )}
                  <Link
                    href="/solutions"
                    className="mt-4 text-sm font-semibold text-stone-white underline-offset-4 hover:underline"
                  >
                    Explore this solution &rarr;
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why-us band */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-trail-orange/90">Why Double Blaze</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              A partner that stays on the trail with you
            </h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHY_US.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-lg font-bold text-stone-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-white/80">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="rounded-2xl bg-ink px-8 py-14 text-center text-stone-white md:px-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to find your path?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-white/80">
              Tell us where your business is today. We will map the next step
              and send back a plan, no pressure and no jargon.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/start-a-project" className="btn-primary">
                Start a project
              </Link>
              <Link href="/pricing" className="btn-on-dark">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

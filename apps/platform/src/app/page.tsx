import Link from "next/link";
import {
  AUDIENCES,
  EXPERIENCE,
  INCLUDED_DELIVERABLES,
  PHASES,
  PRACTICE_AREAS,
  PRICE_TIERS,
  TRAIL_MAP,
  WHY_US,
  formatPrice,
  stepPrice,
} from "@/lib/practice";
import { INTAKE_HREF, INTAKE_LABEL } from "@/lib/site";
import { CtaBand } from "@/components/CtaBand";
import { CompareModels } from "@/components/CompareModels";
import { OfficesBand } from "@/components/OfficesBand";
import { TrailMapBand } from "@/components/TrailMapBand";

/**
 * Homepage. The thread through every section is the model (you pay only for
 * program management; what we build is included) plus the depth of the team
 * (James, 2026-11-24: "emphasize the pricing model + expertise").
 */
const HERO_POINTS = [
  "Published, fixed prices",
  "Software and design included",
  "Unlimited users",
  "Hosting at our cost",
];

export default function HomePage() {
  const starter = PRICE_TIERS[0];
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-blaze-maroon text-stone-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-impact-orange/30 to-transparent"
        />
        <div className="container-page relative grid gap-12 py-20 md:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <p className="eyebrow text-trail-orange/90">
              Veteran-owned &middot; Program management
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Pay for the experts, not the hours. Everything we build is
              included.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
              Program managers who have led work for the biggest names in
              entertainment, sports, consumer brands, and government, across
              seven practice areas. You pay a published, fixed price for program
              management. The software, designs, and content are included, and
              they are yours.
            </p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {HERO_POINTS.map((p) => (
                <li
                  key={p}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-white/25 px-3 py-1.5 text-xs font-semibold text-stone-white/90"
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-trail-orange" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={INTAKE_HREF} className="btn-primary">
                {INTAKE_LABEL}
              </Link>
              <Link href="/pricing" className="btn-on-dark">
                See the price menu
              </Link>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="rounded-2xl border border-stone-white/20 bg-ink/25 p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-trail-orange">
                Your {TRAIL_MAP} starts at
              </p>
              <p className="mt-2 text-5xl font-bold">{formatPrice(starter.trailMap)}</p>
              <p className="mt-2 text-sm text-stone-white/75">
                for a {starter.name} program, and it is fully credited toward
                the build if you build with us. Every step has a fixed,
                published price. No hourly billing, no surprise invoices.
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-stone-white/15 pt-5 text-sm">
                <div>
                  <dt className="text-stone-white/60">You pay for</dt>
                  <dd className="mt-1 font-semibold">Program management</dd>
                </div>
                <div>
                  <dt className="text-stone-white/60">Deliverables</dt>
                  <dd className="mt-1 font-semibold">Included, yours</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {/* Experience bar */}
      <section aria-label="Team experience" className="border-b border-ink/10 bg-stone-white">
        <div className="container-page py-6 text-center">
          <p className="text-sm font-semibold text-ink/80">
            Our team has led and delivered work for {EXPERIENCE.slice(0, -1).join(", ")}, and{" "}
            {EXPERIENCE[EXPERIENCE.length - 1]}.
          </p>
        </div>
      </section>

      {/* The model, compared */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">A different model</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Most firms bill for the work. We include it.
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              We built our own tools to handle production, so the apps, designs,
              blueprints, and content cost you nothing extra. What you pay for is
              senior program management, at a price you can see before you call
              us.
            </p>
          </div>
          <div className="mt-10">
            <CompareModels />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-primary">
              See the price menu
            </Link>
            <Link href="/how-we-work" className="btn-secondary">
              How the four steps work
            </Link>
          </div>
        </div>
      </section>

      {/* Practice areas: the expertise */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">The expertise</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Big-firm depth in seven practice areas
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              Each practice is led by a program manager who has done this work
              at the highest level, from world-class theme parks to statewide
              systems. When a program needs more, we bring in specialists.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRACTICE_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/practice-areas#${area.slug}`}
                className="group flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6 transition-colors hover:border-trail-orange/50"
              >
                <h3 className="text-lg font-bold text-ink">{area.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">
                  {area.summary}
                </p>
                <span className="mt-4 text-sm font-semibold text-impact-orange group-hover:text-blaze-maroon">
                  Learn more &rarr;
                </span>
              </Link>
            ))}
            <Link
              href={INTAKE_HREF}
              className="flex flex-col justify-center rounded-xl bg-ridge-green p-6 text-stone-white"
            >
              <h3 className="text-lg font-bold">Not sure where it fits?</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-white/80">
                Tell us what you need and we will bring the right groups
                together.
              </p>
              <span className="mt-4 text-sm font-semibold text-trail-orange">
                {INTAKE_LABEL} &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Included + transparency */}
      <section className="bg-stone-white">
        <div className="container-page grid gap-8 py-20 md:py-24 lg:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-8">
            <p className="eyebrow">Included in every program</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              What other firms invoice, we include
            </h2>
            <ul className="mt-6 grid gap-3 text-sm text-ink/80 sm:grid-cols-2">
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
            <p className="mt-6 border-t border-ink/10 pt-4 text-sm text-ink/65">
              You own all of it, with unlimited users and no license fees.
              Physical work and labor, such as materials, fabrication,
              construction, or a video capture, is estimated in your{" "}
              {TRAIL_MAP} and passed through at cost.
            </p>
          </div>
          <div className="flex flex-col rounded-2xl bg-ink p-8 text-stone-white">
            <p className="eyebrow text-trail-orange">Cost transparency</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              We show you what hosting actually costs us
            </h2>
            <p className="mt-4 text-stone-white/80">
              Run what we build in your own environment, or in ours at exactly
              what it costs us, with no markup. We publish those costs, so you
              never have to take our word for it.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-stone-white/85">
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange" />
                Public monthly hosting costs, by service
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange" />
                Typical cost per program, by tier
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange" />
                Your own line-by-line costs, matched to your invoice
              </li>
            </ul>
            <p className="mt-auto pt-8 text-xs font-semibold uppercase tracking-wide text-stone-white/50">
              Live cost page launching soon
            </p>
          </div>
        </div>
      </section>

      <TrailMapBand />

      {/* Four steps */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">How we work</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Four steps, each with a fixed price
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              Start with a {TRAIL_MAP} and decide from there. Adding something
              new later starts with a new {TRAIL_MAP}, usually a much shorter
              one.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((phase) => (
              <li key={phase.n} className="rounded-xl border border-ink/10 bg-stone-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-trail-orange text-sm font-bold text-stone-white">
                  {phase.n}
                </span>
                <h3 className="mt-4 font-bold text-ink">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{phase.summary}</p>
                <p className="mt-3 text-xs font-semibold text-impact-orange">
                  {phase.n === 3 ? stepPrice(starter, 3) : `From ${stepPrice(starter, phase.n)}`}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href="/pricing"
            className="mt-8 inline-block text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
          >
            See every tier and price &rarr;
          </Link>
        </div>
      </section>

      {/* Who we serve */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Who we serve</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              From Main Street to federal agencies
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <article key={a.title} className="rounded-xl border border-ink/10 p-6">
                <h3 className="text-lg font-bold text-ink">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{a.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink/70">
            Buying for an agency or a prime contract?{" "}
            <Link
              href="/government"
              className="font-semibold text-impact-orange hover:text-blaze-maroon"
            >
              See how we work with government
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Why-us band, with the brand story */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow text-trail-orange/90">When the trail turns, we mark the way</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Big-firm expertise. A price built for real budgets.
            </h2>
            <p className="mt-4 text-stone-white/80">
              On the Appalachian Trail, a double blaze tells you a change is
              coming and to pay attention. Every program is full of those turns.
              Seeing them early and keeping everyone on the right path is the one
              thing we sell.
            </p>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHY_US.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-lg font-bold text-stone-white">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-white/80">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OfficesBand />

      <CtaBand />
    </>
  );
}

import Link from "next/link";
import {
  AUDIENCES,
  EXPERIENCE,
  INCLUDED_DELIVERABLES,
  PHASES,
  PRACTICE_AREAS,
  WHY_US,
} from "@/lib/practice";
import { INTAKE_HREF, INTAKE_LABEL } from "@/lib/site";
import { CtaBand } from "@/components/CtaBand";
import { OfficesBand } from "@/components/OfficesBand";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-blaze-maroon text-stone-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-impact-orange/30 to-transparent"
        />
        <div className="container-page relative py-20 md:py-28">
          <div className="md:max-w-3xl lg:max-w-4xl">
            <p className="eyebrow text-trail-orange/90">
              Veteran-owned &middot; Program management
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              You pay for program management. Everything we build is yours.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
              Double Blaze runs programs across seven practice areas, from
              technology and data to themed destinations and events. The
              software, designs, and content your program produces are included,
              owned by you, with no license fees and no limit on users.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={INTAKE_HREF} className="btn-primary">
                {INTAKE_LABEL}
              </Link>
              <Link href="/how-we-work" className="btn-on-dark">
                How it works
              </Link>
            </div>
          </div>
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

      {/* Brand-idea band */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Why Double Blaze</p>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              When the trail turns, we mark the way.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/75">
              On the Appalachian Trail, a double blaze tells you a change is
              coming and to pay attention. Every program is full of those turns.
              Program management is the work of seeing them early and keeping
              everyone on the right path, and it is the one thing we sell.
            </p>
          </div>
        </div>
      </section>

      {/* Practice areas */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Practice areas</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Seven practice areas. One discipline.
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              Each practice is led by a program manager who has done this work
              at the highest level, and we bring in specialists whenever the
              program calls for them.
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

      {/* The model */}
      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-20 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <p className="eyebrow">How we charge</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Pay for the program. The deliverables are included.
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              We build our own tools to do the production work, so we do not
              charge you for it. You pay for program management, priced by the
              value of each phase, not by the hour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-primary">
                How pricing works
              </Link>
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6 md:p-8">
              <h3 className="text-lg font-bold text-ink">Included in every program</h3>
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
              <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-ink">You own it</dt>
                  <dd className="mt-1 text-ink/70">No license fees, no lock-in.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Unlimited users</dt>
                  <dd className="mt-1 text-ink/70">Your whole organization, at no extra cost.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Hosting at cost</dt>
                  <dd className="mt-1 text-ink/70">Your environment, or ours at what it costs us.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Five phases */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">How we work</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Five phases, every program
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              Buy one phase or all five. Adding something new later starts back
              at discovery, usually a much shorter one.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {PHASES.map((phase) => (
              <li key={phase.n} className="rounded-xl border border-ink/10 bg-stone-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-trail-orange text-sm font-bold text-stone-white">
                  {phase.n}
                </span>
                <h3 className="mt-4 font-bold text-ink">{phase.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{phase.summary}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/how-we-work"
            className="mt-8 inline-block text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
          >
            See the phases in detail &rarr;
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

      {/* Why-us band */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-trail-orange/90">Why Double Blaze</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Big-firm expertise. A price built for real budgets.
            </h2>
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

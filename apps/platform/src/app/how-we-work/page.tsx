import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { PHASES, TRAIL_MAP } from "@/lib/practice";
import { TrailMapBand } from "@/components/TrailMapBand";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "Every Double Blaze program runs through four steps: the Trail Map, build and test, deliver, and maintain.",
};

export default function HowWeWorkPage() {
  return (
    <>
      <PageHero
        eyebrow="How we work"
        title="Four steps. Every program, every practice."
        intro={`Whether it is an app, a payroll program, a theme park attraction, or a conference, the work runs through the same four steps. It starts with a ${TRAIL_MAP} you own, and you always know what each step delivers.`}
      />

      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <ol className="space-y-5">
            {PHASES.map((phase) => (
              <li
                key={phase.n}
                className="grid gap-4 rounded-xl border border-ink/10 p-6 md:grid-cols-12 md:items-start md:p-8"
              >
                <div className="flex items-center gap-4 md:col-span-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-trail-orange font-bold text-stone-white">
                    {phase.n}
                  </span>
                  <h2 className="text-xl font-bold text-ink">{phase.title}</h2>
                </div>
                <p className="text-ink/75 md:col-span-5">{phase.summary}</p>
                <p className="text-sm font-semibold text-ridge-green md:col-span-3">
                  {phase.outcome}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <TrailMapBand />

      <section className="bg-ink/[0.03]">
        <div className="container-page grid gap-10 py-16 md:grid-cols-3 md:py-20">
          <div>
            <h2 className="text-lg font-bold text-ink">It starts with a free call</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Before anything begins, we have a free discovery call with the
              program management group that fits your needs. That call becomes
              a proposal, with a fixed price for each step.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">New work starts with a new {TRAIL_MAP}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Want a new feature or a fresh idea on something we already built?
              It starts with a new {TRAIL_MAP}, which is usually much shorter,
              and priced to match.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Maintenance is program management</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Updates, changes, and additions after launch are covered by the
              program management fee. The building itself stays included.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

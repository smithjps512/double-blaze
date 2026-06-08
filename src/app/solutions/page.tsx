import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SOLUTIONS } from "@/lib/content";
import { PLANS, formatUSD } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Whether you need to get online, run leaner, or scale up, there is a Double Blaze trail for where your business is today.",
};

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Where you are on the trail"
        title="Solutions for every stage"
        intro="Three paths, mapped to where your business is right now. Each one points to the plan that fits, and you can move up the trail as you grow."
      />
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="space-y-8">
            {SOLUTIONS.map((solution, i) => {
              const plan = PLANS.find(
                (p) => p.slug === solution.recommendedPlan,
              );
              return (
                <article
                  key={solution.slug}
                  id={solution.slug}
                  className="scroll-mt-24 grid gap-6 rounded-xl border border-ink/10 bg-stone-white p-8 md:grid-cols-12 md:items-center"
                >
                  <div className="md:col-span-8">
                    <p className="text-sm font-semibold text-trail-orange">
                      Step {i + 1}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-ink">
                      {solution.title}
                    </h2>
                    <p className="mt-2 font-medium text-ink/80">
                      {solution.outcome}
                    </p>
                    <p className="mt-3 text-ink/70">{solution.blurb}</p>
                  </div>
                  {plan && (
                    <div className="rounded-lg bg-ridge-green p-6 text-stone-white md:col-span-4">
                      <p className="text-sm text-stone-white/70">Recommended</p>
                      <p className="mt-1 text-xl font-bold">{plan.name}</p>
                      <p className="mt-1 text-2xl font-bold text-trail-orange">
                        {formatUSD(plan.priceMonthly)}
                        <span className="text-base font-normal text-stone-white/70">
                          /mo
                        </span>
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-4 inline-block text-sm font-semibold text-stone-white underline-offset-4 hover:underline"
                      >
                        See what is included &rarr;
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-12">
            <Link href="/start-a-project" className="btn-primary">
              Start a project
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SOLUTIONS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Double Blaze does not just advise. We build and run our own products for the community, from emergency readiness to local jobs.",
};

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions / products"
        title="Solutions we have built"
        intro="We do not just advise. We build and run our own products for the community, putting national-brand product experience to work for the people next door."
      />
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {SOLUTIONS.map((solution) => (
              <article
                key={solution.slug}
                id={solution.slug}
                className="flex scroll-mt-24 flex-col rounded-xl border border-ink/10 bg-ridge-green p-7 text-stone-white"
              >
                {solution.tag && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-stone-white/15 px-3 py-1 text-xs font-semibold text-stone-white">
                    {solution.tag}
                  </span>
                )}
                <h2 className="text-xl font-bold">{solution.title}</h2>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-stone-white/80">
                  {solution.blurb}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-ink/10 bg-ink/[0.03] p-8 md:p-10">
            <h2 className="text-2xl font-bold text-ink">
              Have a product idea of your own?
            </h2>
            <p className="mt-3 max-w-2xl text-ink/75">
              The same team that builds these products can build yours. We bring
              big-league experience home and put it to work for local business.
            </p>
            <Link href="/start-a-project" className="btn-primary mt-6">
              Start a project
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getResolvedRegions } from "@/lib/regions-db";

// DB-resolved (with static-seed fallback) so newly activated regions appear
// without a redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Where we work",
  description:
    "Double Blaze Solutions delivers enterprise-grade technology locally. See the regions we serve and where we are headed next.",
  alternates: { canonical: "/regions" },
};

export default async function RegionsIndexPage() {
  const regions = await getResolvedRegions();
  const active = regions.filter((r) => r.status === "active");
  const comingSoon = regions.filter((r) => r.status === "coming_soon");

  return (
    <>
      <PageHero
        eyebrow="Where we work"
        title="Local delivery, wherever we are."
        intro="Double Blaze brings national-brand technology expertise to local businesses. Choose your region to meet your local lead, or join the list for a region we are opening next."
      />
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          {active.length > 0 && (
            <>
              <h2 className="text-2xl font-bold text-ink">Open now</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/regions/${r.slug}`}
                    className="flex flex-col rounded-xl border border-ink/10 bg-ink/[0.02] p-6 transition-colors hover:border-trail-orange/50"
                  >
                    <h3 className="text-lg font-bold text-ink">{r.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
                      {r.introBlurb}
                    </p>
                    <span className="mt-4 text-sm font-semibold text-impact-orange">
                      Visit {r.name} &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {comingSoon.length > 0 && (
            <>
              <h2 className="mt-14 text-2xl font-bold text-ink">Coming soon</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {comingSoon.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/regions/${r.slug}`}
                    className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6 transition-colors hover:border-ridge-green/40"
                  >
                    <span className="inline-flex w-fit rounded-full bg-ridge-green/10 px-3 py-1 text-xs font-semibold text-ridge-green ring-1 ring-ridge-green/20">
                      Coming soon
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-ink">{r.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
                      {r.introBlurb}
                    </p>
                    <span className="mt-4 text-sm font-semibold text-ridge-green">
                      Join the list &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

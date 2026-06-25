import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { StartProjectForm } from "@/components/StartProjectForm";
import { BRAND } from "@/lib/brand";
import { activeRegions, getRegionBySlug } from "@/lib/regions";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Tell us about your business and what you want to build. We will recommend a path and reply within one business day.",
};

export default async function StartProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; item?: string; region?: string }>;
}) {
  const params = await searchParams;
  const defaultInterest = params.plan ?? params.item ?? "";
  const regions = activeRegions().map((r) => ({ slug: r.slug, name: r.name }));
  const defaultRegion = params.region
    ? getRegionBySlug(params.region)?.slug ?? ""
    : "";

  return (
    <>
      <PageHero
        eyebrow="Let's map your path"
        title="Start a project"
        intro="Tell us where your business is and where you want it to go. We will reply within one business day with a recommended plan, no obligation."
      />
      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <StartProjectForm
              defaultInterest={defaultInterest}
              regions={regions}
              defaultRegion={defaultRegion}
            />
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">What happens next</h2>
              <ol className="mt-4 space-y-4 text-sm text-ink/75">
                <Step n={1} title="You send this form">
                  A few details about your business and goals.
                </Step>
                <Step n={2} title="We reply with a path">
                  Within one business day, with a recommended plan or project.
                </Step>
                <Step n={3} title="We map the brief together">
                  Our Spark intake captures the details and we draft a scope you
                  approve before work starts.
                </Step>
              </ol>
              <p className="mt-6 border-t border-ink/10 pt-4 text-sm text-ink/60">
                Prefer email? Reach us at{" "}
                <a
                  href={`mailto:${BRAND.email}`}
                  className="font-medium text-impact-orange hover:text-blaze-maroon"
                >
                  {BRAND.email}
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-trail-orange text-sm font-bold text-stone-white">
        {n}
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        {children}
      </span>
    </li>
  );
}

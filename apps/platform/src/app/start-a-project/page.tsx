import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { NeedsIntakeForm } from "@/components/NeedsIntakeForm";
import { BRAND } from "@/lib/brand";
import { getPracticeArea } from "@/lib/practice";
import { BOOK_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tell us about your needs",
  description:
    "Tell us what you need. We connect you with the right program management group for a free discovery call, and the call becomes your proposal.",
};

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ practice?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.practice)
    ? params.practice
    : params.practice
      ? [params.practice]
      : [];
  const defaultPractices = requested.filter((slug) => getPracticeArea(slug));

  return (
    <>
      <PageHero
        eyebrow="Free discovery call"
        title="Tell us about your needs"
        intro="A few details are enough. We route your request to the program management group, or groups, that fit, and set up a free discovery call. That conversation becomes your proposal."
      />
      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <NeedsIntakeForm
              defaultPractices={defaultPractices}
              bookingHref={BOOK_HREF}
            />
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">What happens next</h2>
              <ol className="mt-4 space-y-4 text-sm text-ink/75">
                <Step n={1} title="You tell us what you need">
                  Pick the areas it touches, or tell us you are not sure. Either
                  is fine.
                </Step>
                <Step n={2} title="We connect the right group">
                  Your request goes straight to the program management group
                  for that work. If it spans several areas, they work it
                  together.
                </Step>
                <Step n={3} title="Free discovery call">
                  A real conversation with the people who would run your
                  program. No cost and no obligation.
                </Step>
                <Step n={4} title="Your proposal">
                  We turn the call into a proposal priced by step, so you know
                  what you are paying for before any work starts.
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

import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { TrailRunStartForm } from "@/components/TrailRunStartForm";
import { getRegionBySlug } from "@/lib/regions";
import { PLANS, formatUSD } from "@/lib/catalog";
import { DEFAULT_TRAIL_TIER, TRAIL_RUN_TIERS } from "@/lib/trail-run";

export const metadata: Metadata = {
  title: "Trail Run: your first month is on us",
  description:
    "We build your site or your workflow, you run it for a full 30 days, and you do not pay until you have seen it work in your own business.",
};

// Tier options for the start form, sourced from the storefront catalog.
const TIER_OPTIONS = TRAIL_RUN_TIERS.map((key) => {
  const plan = PLANS.find((p) => p.catalogKey === key);
  return {
    key,
    name: plan?.name ?? key,
    priceMonthly: plan?.priceMonthly ?? 0,
    tagline: plan?.tagline ?? "",
  };
});

const STEPS = [
  {
    title: "Tell us about your business.",
    body: "Our intake takes a few minutes and our AI does most of the work.",
  },
  {
    title: "We build it.",
    body: "A real website, your store, your daily posts, one workflow we automate for you, AI customer support, inventory, and a live results dashboard.",
  },
  {
    title: "You run it for 30 days.",
    body: "Your window starts the day it goes live, not the day you sign up, so build time never eats your evaluation.",
  },
  {
    title: "We check in along the way.",
    body: "We show you exactly what it is producing: leads, sales, hours saved.",
  },
  {
    title: "On day 31 you decide.",
    body: "Continue, move up or down a level, or stop. You are only charged if you stay.",
  },
];

export default async function TrailRunPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region: regionParam } = await searchParams;
  const region = regionParam ? getRegionBySlug(regionParam)?.slug : undefined;

  return (
    <>
      <PageHero
        eyebrow="Trail Run"
        title="Your first month is on us"
        intro="We build your site or your workflow, you run it for a full 30 days, and you do not pay a thing until you have seen it work in your own business. Stay if it earns it. Walk away if it does not."
      />

      {/* How it works: lead with the value, not a countdown. */}
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold text-ink">How it works</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-trail-orange text-sm font-bold text-stone-white"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{step.title}</p>
                  <p className="mt-1 text-ink/70">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-sm text-ink/60">
            We do ask for a card at signup so that nothing breaks if you continue.
            You will not be charged until day 31, and you can stop anytime before
            then in one click.
          </p>
        </div>
      </section>

      {/* Start */}
      <section className="bg-ink/[0.03]">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold text-ink">Start your Trail Run</h2>
            <p className="mt-2 text-ink/70">
              Pick where you want to start. There is no charge today.
            </p>
            <div className="mt-8">
              <TrailRunStartForm
                tiers={TIER_OPTIONS}
                defaultTier={DEFAULT_TRAIL_TIER}
                region={region}
              />
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
              <h3 className="text-lg font-bold text-ink">Why we do this</h3>
              <p className="mt-3 text-sm text-ink/70">
                We would rather show you than tell you. Plenty of companies will
                take a year of your money before you have seen a single result.
                We do the work first. If it does not earn its place in your
                business in 30 days, you owe us nothing.
              </p>
              <p className="mt-4 text-sm text-ink/70">
                Default is {PLANS.find((p) => p.catalogKey === DEFAULT_TRAIL_TIER)?.name ?? "Blue Trail"},
                the full operation:{" "}
                {formatUSD(
                  PLANS.find((p) => p.catalogKey === DEFAULT_TRAIL_TIER)
                    ?.priceMonthly ?? 0,
                )}
                /mo only if you continue past day 31.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

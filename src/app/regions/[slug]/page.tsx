import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { RegionInterestForm } from "@/components/RegionInterestForm";
import { getResolvedRegion } from "@/lib/regions-db";
import { isActiveRegion, regionJsonLd, type Region } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";
import { BRAND } from "@/lib/brand";

// DB-resolved so the readiness toggle (coming_soon -> active) is live without a
// redeploy. Falls back to the static seed when Supabase is not configured, so
// the page still renders with zero secrets.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const region = await getResolvedRegion(slug);
  if (!region) return { title: "Region not found" };

  const active = isActiveRegion(region);
  return {
    title: `Double Blaze in ${region.name}`,
    description: region.introBlurb,
    alternates: { canonical: `/regions/${region.slug}` },
    // Only active regions are indexable (task item 2).
    robots: active ? undefined : { index: false, follow: true },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = await getResolvedRegion(slug);
  if (!region) notFound();

  return isActiveRegion(region) ? (
    <ActiveRegion region={region} />
  ) : (
    <ComingSoonRegion region={region} />
  );
}

// ---------------------------------------------------------------------------
// Active region: full local landing page.
// ---------------------------------------------------------------------------
function ActiveRegion({ region }: { region: Region }) {
  const telHref = region.localPhone
    ? `tel:${region.localPhone.replace(/[^+\d]/g, "")}`
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(regionJsonLd(region, SITE_URL)),
        }}
      />
      <PageHero
        eyebrow={`Double Blaze · ${region.name}`}
        title={`Enterprise technology, delivered across ${region.name}.`}
        intro={region.introBlurb}
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/start-a-project?region=${region.slug}`}
            className="btn-primary"
          >
            Start a project in {region.name}
          </Link>
          {telHref && (
            <a href={telHref} className="btn-on-dark">
              Call {region.localPhone}
            </a>
          )}
        </div>
      </PageHero>

      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          {/* Local lead */}
          <div className="md:col-span-7">
            {region.lead && (
              <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-6 sm:p-8">
                <p className="eyebrow">Your local lead</p>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                  {region.lead.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={region.lead.photoUrl}
                      alt={`${region.lead.name}, Double Blaze lead for ${region.name}`}
                      className="h-24 w-24 flex-none rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-ink">
                      {region.lead.name}
                    </h2>
                    {region.lead.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-ink/75">
                        {region.lead.bio}
                      </p>
                    )}
                    {telHref && (
                      <a
                        href={telHref}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path d="M7.4 2.6 5.2 2A1.5 1.5 0 0 0 3.4 3l-.6 2.2a1.5 1.5 0 0 0 .4 1.5l1.6 1.6a12 12 0 0 0 5 5l1.6 1.6c.4.4 1 .5 1.5.4l2.2-.6a1.5 1.5 0 0 0 1.1-1.8l-.6-2.2a1.5 1.5 0 0 0-1.2-1.1l-2-.3a1.5 1.5 0 0 0-1.3.4l-.7.7a9 9 0 0 1-3-3l.7-.7a1.5 1.5 0 0 0 .4-1.3l-.3-2a1.5 1.5 0 0 0-1.1-1.2Z" />
                        </svg>
                        {region.localPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Local proof slots, each rendered only when present. */}
            <RegionProof region={region} />
          </div>

          {/* Cities served + CTA */}
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">Service area</h2>
              <p className="mt-1 text-sm text-ink/60">
                We serve businesses across {region.name}, including:
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {region.citiesServed.map((city) => (
                  <li
                    key={city}
                    className="rounded-full bg-stone-white px-3 py-1 text-sm font-medium text-ink/80 ring-1 ring-ink/10"
                  >
                    {city}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-ink/10 pt-5">
                <Link
                  href={`/start-a-project?region=${region.slug}`}
                  className="btn-primary w-full"
                >
                  Start a project
                </Link>
                <p className="mt-3 text-xs text-ink/55">
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
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function RegionProof({ region }: { region: Region }) {
  const proof = region.proof;
  if (!proof) return null;
  const hasAny =
    (proof.testimonials?.length ?? 0) +
      (proof.clients?.length ?? 0) +
      (proof.community?.length ?? 0) >
    0;
  if (!hasAny) return null;

  return (
    <div className="mt-8 space-y-8">
      {proof.testimonials && proof.testimonials.length > 0 && (
        <div>
          <p className="eyebrow">What local clients say</p>
          <div className="mt-4 space-y-4">
            {proof.testimonials.map((t) => (
              <figure
                key={t.attribution}
                className="rounded-xl border border-ink/10 bg-stone-white p-5"
              >
                <blockquote className="text-sm leading-relaxed text-ink/80">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-ink">
                  {t.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {proof.clients && proof.clients.length > 0 && (
        <div>
          <p className="eyebrow">Local clients</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {proof.clients.map((c) => (
              <li
                key={c}
                className="rounded-full bg-stone-white px-3 py-1 text-sm font-medium text-ink/80 ring-1 ring-ink/10"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {proof.community && proof.community.length > 0 && (
        <div>
          <p className="eyebrow">In the community</p>
          <ul className="mt-4 space-y-2 text-sm text-ink/75">
            {proof.community.map((c) => (
              <li key={c} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coming-soon region: interest capture only. Not indexable.
// ---------------------------------------------------------------------------
function ComingSoonRegion({ region }: { region: Region }) {
  return (
    <>
      <PageHero
        eyebrow={`Double Blaze · ${region.name}`}
        title={`Interested in Double Blaze in ${region.name}?`}
        intro={region.introBlurb}
      />
      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <span className="inline-flex w-fit rounded-full bg-ridge-green/10 px-3 py-1 text-xs font-semibold text-ridge-green ring-1 ring-ridge-green/20">
              Coming soon
            </span>
            <h2 className="mt-4 text-2xl font-bold text-ink">
              Join the list
            </h2>
            <p className="mt-2 max-w-xl text-ink/75">
              We are lining up a local lead for {region.name}. Add your name and
              we will reach out the moment we open. No spam, no obligation.
            </p>
            <div className="mt-6 max-w-xl">
              <RegionInterestForm slug={region.slug} regionName={region.name} />
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">
                Where we are headed
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                When we open in {region.name}, we plan to serve:
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {region.citiesServed.map((city) => (
                  <li
                    key={city}
                    className="rounded-full bg-stone-white px-3 py-1 text-sm font-medium text-ink/80 ring-1 ring-ink/10"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

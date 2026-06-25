import Link from "next/link";
import { SERVICES, SOLUTIONS, PROOF_POINTS, WHY_US } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { activeRegions, allRegions } from "@/lib/regions";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-blaze-maroon text-stone-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-impact-orange/30 to-transparent"
        />
        <div className="container-page relative grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-9 lg:col-span-8">
            <p className="eyebrow text-trail-orange/90">
              Veteran-owned &middot; Serving the New River &amp; Roanoke valleys
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Enterprise-grade technology, built right here at home.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
              Double Blaze Solutions helps businesses across the New River
              Valley, Roanoke Valley, and Martinsville/Danville grow with
              websites, apps, and digital strategy, delivered by a team that has
              built for some of the biggest names in the world.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/start-a-project" className="btn-primary">
                Start a project
              </Link>
              <Link href="/services" className="btn-on-dark">
                See what we build
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proof bar */}
      <section
        aria-label="At a glance"
        className="border-b border-ink/10 bg-stone-white"
      >
        <div className="container-page">
          <ul className="grid grid-cols-1 divide-y divide-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {PROOF_POINTS.map((point) => (
              <li
                key={point}
                className="px-2 py-5 text-center text-sm font-semibold text-ink/80 md:px-6"
              >
                {point}
              </li>
            ))}
          </ul>
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
              coming and to pay attention. Technology is full of those turns for
              a growing business. We help you read what is ahead and take the
              right next step, with people who live and work right here.
            </p>
          </div>
        </div>
      </section>

      {/* Four service cards */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">What we do</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              What we do for local business
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              From your first website to the app that sets you apart, we build
              the technology that helps you grow.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <article
                key={service.slug}
                className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-6"
              >
                <h3 className="text-lg font-bold text-ink">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {service.blurb}
                </p>
                {service.points.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-ink/70">
                    {service.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold text-ink">
              Plans from $199 a month.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/services"
                className="text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
              >
                See all services &rarr;
              </Link>
              <Link href="/start-a-project" className="btn-primary">
                Book a free consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three solution / product cards */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Solutions / products</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Solutions we have built
            </h2>
            <p className="mt-4 text-lg text-ink/75">
              We do not just advise. We build and run our own products for the
              community.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOLUTIONS.map((solution) => (
              <article
                key={solution.slug}
                className="flex flex-col rounded-xl border border-ink/10 bg-ridge-green p-7 text-stone-white"
              >
                {solution.tag && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-stone-white/15 px-3 py-1 text-xs font-semibold text-stone-white">
                    {solution.tag}
                  </span>
                )}
                <h3 className="text-xl font-bold">{solution.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-stone-white/80">
                  {solution.blurb}
                </p>
                <Link
                  href="/solutions"
                  className="mt-6 text-sm font-semibold text-trail-orange underline-offset-4 hover:underline"
                >
                  Explore our solutions &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why-us band */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-trail-orange/90">Why Double Blaze</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Why teams choose Double Blaze
            </h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHY_US.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-lg font-bold text-stone-white">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-white/80">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where we work */}
      <RegionBand />

      {/* Closing CTA */}
      <section className="bg-stone-white">
        <div className="container-page py-20 md:py-24">
          <div className="rounded-2xl bg-ink px-8 py-14 text-center text-stone-white md:px-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Let&apos;s build something for your business.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-white/80">
              Tell us what you are working on. The first conversation is free,
              and it is with the people who will actually do the work.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/start-a-project" className="btn-primary">
                Start a project
              </Link>
              <a href={`mailto:${BRAND.email}`} className="btn-on-dark">
                {BRAND.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Home region selector band (task item 3): active regions plus the full list,
 * routing visitors to their region page. Renders from the static seed. */
function RegionBand() {
  const active = activeRegions();
  const all = allRegions();
  if (all.length === 0) return null;

  return (
    <section className="bg-ink/[0.03]">
      <div className="container-page py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Where we work</p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Local delivery, wherever we are.
          </h2>
          <p className="mt-4 text-lg text-ink/75">
            Choose your region to meet your local lead, or join the list for a
            region we are opening next.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((region) => {
            const isActive = region.status === "active";
            return (
              <Link
                key={region.slug}
                href={`/regions/${region.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-stone-white px-5 py-4 transition-colors hover:border-trail-orange/50"
              >
                <span className="font-semibold text-ink">{region.name}</span>
                <span
                  className={
                    isActive
                      ? "text-sm font-semibold text-impact-orange"
                      : "rounded-full bg-ridge-green/10 px-2.5 py-1 text-xs font-semibold text-ridge-green"
                  }
                >
                  {isActive ? "Open →" : "Coming soon"}
                </span>
              </Link>
            );
          })}
        </div>
        {active.length > 0 && (
          <p className="mt-6 text-sm text-ink/60">
            Not seeing your area?{" "}
            <Link
              href="/start-a-project"
              className="font-medium text-impact-orange hover:text-blaze-maroon"
            >
              Tell us where you are
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Websites and ecommerce, workflow automation, AI content and support, and business dashboards, built and run for small businesses.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Services built and run for you"
        intro="Pick a single project or a monthly plan that bundles them. Every service is delivered by our team and tracked from kickoff to handoff."
      />
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-2">
            {SERVICES.map((service) => (
              <article
                key={service.slug}
                id={service.slug}
                className="scroll-mt-24 rounded-xl border border-ink/10 bg-stone-white p-8"
              >
                <h2 className="text-2xl font-bold text-ink">
                  {service.title}
                </h2>
                <p className="mt-3 text-ink/70">{service.blurb}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink/75">
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing" className="btn-primary">
              See pricing
            </Link>
            <Link href="/start-a-project" className="btn-secondary">
              Start a project
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

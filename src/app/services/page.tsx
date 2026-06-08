import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Websites, apps, social and digital marketing, and technology consulting for local business, delivered by a veteran-owned team with national-brand experience.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do for local business"
        title="The technology that helps you grow"
        intro="From your first website to the app that sets you apart, we build the technology that helps you grow. National-brand depth, applied to local problems, by neighbors who are invested in your success."
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
                {service.points.length > 0 && (
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
                )}
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <p className="text-base font-semibold text-ink">
              Plans from $199 a month.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/start-a-project" className="btn-primary">
                Book a free consultation
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

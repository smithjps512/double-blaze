import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { PRACTICE_AREAS } from "@/lib/practice";
import { INTAKE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practice areas",
  description:
    "Program management across technology and app development, people and culture, data and analytics, themed destinations and experiences, facility management, event management, and event operations.",
};

export default function PracticeAreasPage() {
  return (
    <>
      <PageHero
        eyebrow="Practice areas"
        title="Seven practice areas. One discipline: program management."
        intro="Each practice is led by a program manager who is best in class in that field. When a program spans several areas, the groups run it together, and we bring in specialists whenever the work calls for them."
      >
        <nav aria-label="Practice areas" className="mt-8 flex flex-wrap gap-2">
          {PRACTICE_AREAS.map((area) => (
            <a
              key={area.slug}
              href={`#${area.slug}`}
              className="rounded-full border border-stone-white/30 px-3 py-1.5 text-xs font-semibold text-stone-white/90 hover:bg-stone-white/10"
            >
              {area.title}
            </a>
          ))}
        </nav>
      </PageHero>

      <section className="bg-stone-white">
        <div className="container-page space-y-6 py-16 md:py-20">
          {PRACTICE_AREAS.map((area, i) => (
            <article
              key={area.slug}
              id={area.slug}
              className="scroll-mt-24 grid gap-6 rounded-xl border border-ink/10 bg-stone-white p-8 md:grid-cols-12"
            >
              <div className="md:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-impact-orange">
                  Practice {i + 1}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-ink">{area.title}</h2>
                <p className="mt-3 text-ink/70">{area.summary}</p>
                <Link
                  href={`${INTAKE_HREF}?practice=${area.slug}`}
                  className="mt-5 inline-block text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
                >
                  Talk to this group &rarr;
                </Link>
              </div>
              <ul className="space-y-2.5 text-sm text-ink/75 md:col-span-7 md:pt-6">
                {area.points.map((point) => (
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
      </section>

      <CtaBand
        title="Your program touches more than one area?"
        body="Most do. Tell us what you need, and the right groups will join the free discovery call together."
      />
    </>
  );
}

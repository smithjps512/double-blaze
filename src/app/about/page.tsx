import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { WHY_US } from "@/lib/content";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Double Blaze is a certified veteran-owned small business based in Virginia, building and running digital tools for small businesses.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Double Blaze"
        title="A veteran-owned partner for the digital trail"
        intro="We started Double Blaze to give small businesses the same digital tools the big players have, without the agency overhead or the guesswork."
      />

      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold text-ink">Our approach</h2>
            <div className="mt-4 space-y-4 text-ink/75">
              <p>
                A blaze is a mark on the trail. A double blaze tells you the
                path is turning. That is the moment most small businesses face
                with technology: the way forward is changing, and it is hard to
                know the next step. We mark the path.
              </p>
              <p>
                We work in clear plans and one-time projects, not open-ended
                retainers. Our Spark intake captures what your project needs, we
                assemble a brief, and you approve the scope before any work
                begins. From there a single project lead owns the delivery,
                month after month.
              </p>
              <p>
                Higher tiers mean we do more of the work for you: content,
                video, training, and integrations produced by our team. You get
                finished deliverables to approve, not a pile of homework.
              </p>
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">The entity</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-ink">Certification</dt>
                  <dd className="text-ink/70">
                    Certified veteran-owned small business
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Based in</dt>
                  <dd className="text-ink/70">{BRAND.region}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Contact</dt>
                  <dd className="text-ink/70">
                    <a
                      href={`mailto:${BRAND.email}`}
                      className="text-impact-orange hover:text-blaze-maroon"
                    >
                      {BRAND.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-16 md:py-20">
          <h2 className="text-2xl font-bold">What you can count on</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHY_US.map((reason) => (
              <div key={reason.title}>
                <h3 className="text-lg font-bold">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-white/80">
                  {reason.body}
                </p>
              </div>
            ))}
          </div>
          <Link href="/start-a-project" className="btn-primary mt-12">
            Start a project
          </Link>
        </div>
      </section>
    </>
  );
}

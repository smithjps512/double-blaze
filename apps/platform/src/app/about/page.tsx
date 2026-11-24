import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { EXPERIENCE, HEADQUARTERS, OFFICES, PRACTICE_AREAS, WHY_US } from "@/lib/practice";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Double Blaze Solutions is a veteran-owned program management company. Big-firm expertise across seven practice areas, priced for real budgets.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Double Blaze"
        title="Big-firm expertise, priced for real budgets"
        intro="We are program managers who have led work for some of the biggest names in entertainment, sports, consumer brands, and government. We bring that caliber to organizations of every size, without the big-firm bill."
      />

      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold text-ink">Our story</h2>
            <div className="mt-4 space-y-4 text-ink/75">
              <p>
                On the Appalachian Trail a single blaze keeps you on the path,
                and a double blaze signals a turn ahead and tells you to pay
                attention. That is our name. Every program is full of those
                turns, and our job is to see them early and keep everyone on the
                right path.
              </p>
              <p>
                Double Blaze is a partnership of program managers, each best in
                class in their field: technology and process automation, people
                and culture, data and analytics at scale, themed destinations
                and media, facilities, and events. When a program needs
                expertise beyond ours, we bring it in.
              </p>
              <p>
                We sell one thing, program management. We built our own tools to
                handle the production work, so the software, designs, and content
                a program produces come included, and they belong to the client.
              </p>
              <p>
                Our team has led and delivered work for {EXPERIENCE.slice(0, -1).join(", ")},
                and {EXPERIENCE[EXPERIENCE.length - 1]}. Our founding is shaped
                by Coast Guard service: show up, follow through, take care of
                people.
              </p>
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">The company</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-ink">Ownership</dt>
                  <dd className="text-ink/70">Veteran-owned and operated</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Central office</dt>
                  <dd className="text-ink/70">
                    {HEADQUARTERS.city}, {HEADQUARTERS.state}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Office and service locations</dt>
                  <dd className="text-ink/70">
                    {OFFICES.map((o) => o.city).join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Practice areas</dt>
                  <dd className="text-ink/70">
                    {PRACTICE_AREAS.map((p) => p.title).join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Serving</dt>
                  <dd className="text-ink/70">
                    Businesses of every size, government agencies, and
                    government contractors
                  </dd>
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
          <h2 className="text-2xl font-bold">Why teams choose Double Blaze</h2>
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
        </div>
      </section>

      <CtaBand />
    </>
  );
}

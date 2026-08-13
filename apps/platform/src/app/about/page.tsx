import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { WHY_US } from "@/lib/content";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description:
    "Double Blaze Solutions is a veteran-owned technology company bringing big-league product experience home to the New River Valley, Roanoke Valley, and Martinsville/Danville.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Double Blaze"
        title="Big-league technology, brought home"
        intro="We give local businesses the caliber of technology and product expertise usually reserved for national brands, delivered by neighbors invested in the region's success."
      />

      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold text-ink">Our story</h2>
            <div className="mt-4 space-y-4 text-ink/75">
              <p>
                On the Appalachian Trail a single blaze keeps you on the path,
                and a double blaze signals a turn ahead and tells you to pay
                attention. That is our name. Technology is full of those turns
                for a growing business, and we help you read the trail and take
                the right next step.
              </p>
              <p>
                The company is led by a founder with two decades building
                digital products for the world&apos;s biggest brands in sports and
                entertainment, and by a Coast Guard veteran whose service shapes
                how we work: show up, follow through, take care of people.
              </p>
              <p>
                We build technology that strengthens our community: practical
                solutions for local businesses, and products that make life in
                the region a little better. We bring big-league experience home
                and put it to work for the people next door.
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
                    Veteran-owned and operated
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Serving</dt>
                  <dd className="text-ink/70">
                    The New River Valley, Roanoke Valley, and
                    Martinsville/Danville
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
          <Link href="/start-a-project" className="btn-primary mt-12">
            Start a project
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { PHASES, PRACTICE_AREAS } from "@/lib/practice";

export const metadata: Metadata = {
  title: "Government",
  description:
    "Program management for local, state, and federal agencies and the contractors who serve them, with a government menu of defined line items.",
};

/**
 * Government buyers. Per the brief, proposals describe deliverables as
 * "included in the program management fee" rather than "free", which reads as
 * a gift in procurement. Keep that wording on this page.
 */
export default function GovernmentPage() {
  return (
    <>
      <PageHero
        eyebrow="Government"
        title="Program management for agencies and the contractors who serve them"
        intro="Local, state, and federal agencies and departments, and the primes and subcontractors working alongside them. One veteran-owned partner across seven practice areas, priced the way procurement needs it."
      />

      <section className="bg-stone-white">
        <div className="container-page grid gap-10 py-16 md:grid-cols-3 md:py-20">
          <Point title="Defined line items">
            Each of the five phases is a defined line item with a fixed price,
            so it maps cleanly to a statement of work or task order.
          </Point>
          <Point title="Fair and reasonable, documented">
            Our government menu is priced no higher than what we offer any
            commercial client for the same work.
          </Point>
          <Point title="Deliverables included">
            Software, designs, blueprints, and content are included in the
            program management fee, and the agency owns them. No per-seat
            licensing.
          </Point>
          <Point title="Your environment">
            Deliverables run in your environment, or in ours with hosting passed
            through at actual cost, documented line by line.
          </Point>
          <Point title="Teaming with contractors">
            We support primes and subcontractors on existing contracts and
            relationships, as a program management partner across practice
            areas.
          </Point>
          <Point title="Veteran-owned">
            Service, trust, and follow-through, from the first call to the
            final report.
          </Point>
        </div>
      </section>

      <section className="bg-ink/[0.03]">
        <div className="container-page grid gap-12 py-16 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="text-2xl font-bold text-ink">Practice areas</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-ink/80">
              {PRACTICE_AREAS.map((a) => (
                <li key={a.slug} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                  />
                  {a.title}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink">The line items</h2>
            <ol className="mt-5 space-y-2.5 text-sm text-ink/80">
              {PHASES.map((p) => (
                <li key={p.n}>
                  <span className="font-semibold text-ink">
                    {p.n}. {p.title}.
                  </span>{" "}
                  {p.outcome}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <CtaBand
        title="Have a solicitation or an existing contract?"
        body="Tell us about it. We will set up a discovery call with the right practice group and respond with a proposal built on defined line items."
      />
    </>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{children}</p>
    </div>
  );
}

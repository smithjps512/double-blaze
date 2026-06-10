import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getOfferingByKey } from "@/lib/catalog-db";
import { PLANS, ALA_CARTE, formatCents } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review and checkout",
  robots: { index: false },
};

const VALID_KEYS = new Set<string>([
  ...PLANS.map((p) => p.catalogKey),
  ...ALA_CARTE.map((a) => a.catalogKey),
]);

export default async function CheckoutReviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  // Unknown offering keys are a real 404; known keys that the DB cannot serve
  // (Supabase not configured or catalog not seeded) get a graceful message.
  if (!VALID_KEYS.has(key)) notFound();

  const offering = await getOfferingByKey(key);

  if (!offering) {
    return (
      <>
        <PageHero eyebrow="Checkout" title="Checkout is not available yet" />
        <section className="bg-stone-white">
          <div className="container-page py-16">
            <p className="max-w-xl text-ink/70">
              Online checkout is being set up. Please reach out and we will get
              you started right away.
            </p>
            <Link href="/start-a-project" className="btn-primary mt-6">
              Contact us
            </Link>
          </div>
        </section>
      </>
    );
  }

  const requiresConsent = !!offering.min_term_months;
  const maintenance =
    offering.requires_maintenance && offering.maintenance_key
      ? await getOfferingByKey(offering.maintenance_key)
      : null;

  return (
    <>
      <PageHero
        eyebrow="Review and checkout"
        title={offering.name}
        intro={offering.description ?? undefined}
      />
      <section className="bg-stone-white">
        <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <CheckoutForm
              catalogKey={offering.catalog_key}
              requiresConsent={requiresConsent}
              termMonths={offering.min_term_months}
            />
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-6">
              <h2 className="text-lg font-bold text-ink">Order summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label={offering.name}>
                  {offering.billing === "recurring"
                    ? `${formatCents(offering.unit_amount)}/mo`
                    : formatCents(offering.unit_amount)}
                </Row>
                {maintenance && (
                  <Row label="Maintenance">
                    {formatCents(maintenance.unit_amount)}/mo
                  </Row>
                )}
                {offering.type === "plan" && (
                  <Row label="Term">
                    {offering.min_term_months}-month minimum
                  </Row>
                )}
              </dl>
              <p className="mt-4 border-t border-ink/10 pt-4 text-xs text-ink/55">
                {offering.billing === "recurring"
                  ? "Billed monthly. Cancel per your agreement after the minimum term."
                  : maintenance
                    ? "One-time build fee billed on your first invoice, then maintenance monthly."
                    : "One-time charge. Client hosted, no maintenance fee."}
                {" "}Applicable sales tax is added at checkout.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink/70">{label}</dt>
      <dd className="font-semibold text-ink">{children}</dd>
    </div>
  );
}

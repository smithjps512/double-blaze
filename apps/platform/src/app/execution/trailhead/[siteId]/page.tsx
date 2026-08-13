import { notFound } from "next/navigation";
import { getIntakeById, getSiteByIntakeId } from "@/lib/trailhead-db";
import { requireStaff } from "@/lib/server-auth";
import { TrailheadStaffActions } from "@/components/TrailheadStaffActions";

/**
 * Staff review surface for a Trailhead site. The route param is the intake id
 * (that is what the internal notification links to). We resolve both the intake
 * and its site record here, so the actions get the correct site id, and we
 * surface any failed customer notifications for this record: a dropped email is
 * never invisible to us.
 */
export const dynamic = "force-dynamic";

interface NotificationFailure {
  tag: string;
  reason: string;
  at: string;
}

export default async function TrailheadStaffReview({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const staff = await requireStaff();
  if (!staff) notFound();

  const { siteId: intakeId } = await params;
  const intake = await getIntakeById(intakeId);
  if (!intake) notFound();

  const site = await getSiteByIntakeId(intakeId);

  const failures: NotificationFailure[] = Array.isArray(site?.notification_failures)
    ? (site!.notification_failures as NotificationFailure[])
    : [];

  const flags: string[] = Array.isArray(intake.out_of_scope_flags)
    ? (intake.out_of_scope_flags as string[])
    : [];

  return (
    <div className="container-page py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Trailhead staff review</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">{intake.site_name}</h1>
        <p className="mt-1 text-ink/70">
          {intake.subdomain}.doubleblaze.solutions · {intake.contact_name} ·{" "}
          {intake.contact_email}
        </p>
        <p className="mt-1 text-sm text-ink/60">
          Status: <strong>{site?.status ?? "no site record"}</strong>
          {site?.preview_sent_at ? " · preview sent" : ""}
          {site?.preview_accepted_at ? " · customer accepted" : ""}
        </p>

        {/* Failed notifications: the Part 1 visibility surface. */}
        {failures.length > 0 && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <h2 className="text-sm font-bold text-red-800">
              Notification failures ({failures.length})
            </h2>
            <p className="mt-1 text-xs text-red-700">
              These customer emails did not send. Follow up directly. The customer
              still has their status page link.
            </p>
            <ul className="mt-3 space-y-2">
              {failures.map((f, i) => (
                <li key={i} className="text-sm text-red-800">
                  <span className="font-semibold">{f.tag}</span>: {f.reason}{" "}
                  <span className="text-red-600">({f.at})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {flags.length > 0 && (
          <div className="mt-6 rounded-lg border border-trail-orange/30 bg-trail-orange/5 p-4">
            <h2 className="text-sm font-bold text-ink">Out-of-scope flags (internal)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
              {flags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <TrailheadStaffActions
            intakeId={intakeId}
            siteId={site?.id ?? null}
            status={site?.status ?? null}
          />
        </div>

        {/* Read view of the draft, so staff can inspect before releasing it. */}
        {site?.approved_content && (
          <details className="mt-8 rounded-lg border border-ink/10 bg-stone-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Content draft (what the customer reviews)
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-ink/75">
              {JSON.stringify(site.approved_content, null, 2)}
            </pre>
          </details>
        )}

        {site?.built_content && (
          <details className="mt-4 rounded-lg border border-ink/10 bg-stone-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Built site config
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-ink/75">
              {JSON.stringify(
                (site.built_content as { config?: unknown }).config ?? {},
                null,
                2,
              )}
            </pre>
            {site.preview_token && (
              <a
                href={`/api/trailhead/preview/${site.preview_token}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-impact-orange underline"
              >
                Open rendered preview
              </a>
            )}
          </details>
        )}
      </div>
    </div>
  );
}

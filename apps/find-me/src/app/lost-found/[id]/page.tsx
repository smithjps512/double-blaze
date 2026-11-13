import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { DetailCheck } from "@/components/DetailCheck";
import { Map, type MapPoint } from "@/components/map/Map";
import { RespondForm } from "@/components/RespondForm";
import { daysAgoLabel, ReportBadge, ReportCard } from "@/components/ReportCard";
import { ShareButtons } from "@/components/ShareButtons";
import { isDemo, siteUrl } from "@/lib/data";
import { PUBLIC_RADIUS_METERS } from "@/lib/geo";
import { isUnread } from "@/lib/messages";
import { suggestMatches, type ReportPrivate } from "@/lib/reports";
import { getReport, getReportPrivate, listReports, reportTitle } from "@/lib/reports-data";
import { SIZE_LABEL } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import { setReportStatus } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string; view?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getReport((await params).id);
  if (!r) return { title: "Not found" };
  const title = reportTitle(r);
  return {
    title,
    description: `${r.colors}. Last seen ${r.areaText}. Message through Find Me.`,
    openGraph: { title, description: `${r.areaText} · ${r.colors}` },
  };
}

type Conv = { id: string; helper_detail: string; created_at: string; last_message_at: string; poster_read_at: string | null };

/** Demo only: what the owner sees, with a sample reply. */
const DEMO_OWNER = {
  secret: "White tip on the end of his tail",
  convs: [
    { id: "demo", helper_detail: "His tail has a white tip, and he has a red collar", created_at: "", last_message_at: new Date().toISOString(), poster_read_at: null },
  ] as Conv[],
};

export default async function ReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { posted, view } = await searchParams;
  const report = await getReport(id);
  if (!report) notFound();
  const { viewer, db } = await getViewer();

  const demoOwner = isDemo() && view === "owner";
  const isOwner = demoOwner || viewer?.id === report.userId;
  const isStaff = Boolean(viewer && (viewer.isAdmin || viewer.shelterIds.length > 0));
  let priv: ReportPrivate | null = null;
  let convs: Conv[] = [];
  if (demoOwner) {
    priv = { reportId: id, exact: report.publicPoint, secretDetail: DEMO_OWNER.secret };
    convs = DEMO_OWNER.convs;
  } else if (db && (isOwner || isStaff)) {
    priv = await getReportPrivate(db, id);
    if (isOwner) {
      const { data } = await db
        .from("fm_conversations")
        .select("id, helper_detail, created_at, last_message_at, poster_read_at")
        .eq("report_id", id)
        .order("last_message_at", { ascending: false });
      convs = (data ?? []) as Conv[];
    }
  }

  const suggestions =
    isOwner && report.status === "open" ? suggestMatches(report, await listReports({ kind: report.kind === "lost" ? "found" : "lost", species: report.species })) : [];

  const title = reportTitle(report);
  const url = `${siteUrl()}/lost-found/${report.id}`;
  const petLabel = report.name || "this pet";
  const points: MapPoint[] = [{ id: "public", point: report.publicPoint, kind: report.status === "reunited" ? "reunited" : report.kind, label: report.areaText }];
  if (priv && !demoOwner) points.push({ id: "exact", point: priv.exact, kind: "exact", label: "Exact spot (private)" });

  const facts: [string, string][] = [
    ["Seen", `${report.seenOn} (${daysAgoLabel(report.seenOn)})`],
    ["Area", report.areaText],
    ["Colors", report.colors],
    ...(report.species === "dog" ? ([["Size", SIZE_LABEL[report.size]]] as [string, string][]) : []),
    ["Sex", report.sex === "unknown" ? "Not sure" : report.sex === "male" ? "Male" : "Female"],
    ["Microchip", report.microchipped === "yes" ? "Yes" : report.microchipped === "no" ? "No" : "Not sure"],
  ];

  return (
    <div className="container-page py-8">
      <Link href="/lost-found" className="btn-quiet -ml-3">
        ← Lost and found
      </Link>

      {posted && (
        <div className="mt-2 rounded-2xl bg-pine-light p-4 text-pine" role="status">
          <strong>Posted, and partner shelters have been alerted.</strong> Now share the link below. Replies come to Find Me
          messages and we email you when one arrives.
        </div>
      )}
      {demoOwner && (
        <p className="mt-2 rounded-2xl bg-sun-light p-4 text-sm">Demo: this is what the owner sees, with a sample reply.</p>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <AnimalPhoto
            name={report.name || (report.species === "dog" ? "Dog" : "Cat")}
            species={report.species}
            photoUrl={report.photoUrl}
            className="aspect-[4/3] w-full rounded-3xl"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <div>
            <Map center={report.publicPoint} zoom={15} points={points} radius={PUBLIC_RADIUS_METERS} className="h-64" />
            <p className="mt-2 text-xs text-muted">
              {priv && !demoOwner
                ? `The dark dot is the exact spot. Only ${isOwner ? "you" : "the poster"} and shelter staff see it.`
                : "The circle shows the general area. The exact spot is private."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <ReportBadge report={report} large />
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">{title}</h1>
            {report.description && <p className="mt-4 text-lg leading-relaxed">{report.description}</p>}
          </div>
          <dl className="card grid grid-cols-2 gap-x-6 gap-y-3 p-6">
            {facts.map(([k, v]) => (
              <div key={k} className={k === "Area" ? "col-span-2" : ""}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {report.status === "reunited" && (
            <p className="rounded-3xl bg-sun-light p-6 font-display text-2xl font-extrabold">Back home. Thank you, neighbors!</p>
          )}

          {report.status === "open" && (
            <section className="card p-6" aria-labelledby="share">
              <h2 id="share" className="font-display text-xl font-extrabold">
                Share this post
              </h2>
              <p className="mb-3 mt-1 text-sm text-muted">Shares link back here, so replies stay private in Find Me.</p>
              <ShareButtons url={url} title={title} flyerHref={`/lost-found/${report.id}/flyer`} />
            </section>
          )}

          {isOwner ? (
            <>
              <section className="card p-6" aria-labelledby="replies">
                <h2 id="replies" className="font-display text-xl font-extrabold">
                  Replies
                </h2>
                {convs.length === 0 ? (
                  <p className="mt-2 text-muted">No replies yet. We will email you when someone responds.</p>
                ) : (
                  <ul className="mt-4 grid gap-4">
                    {convs.map((c) => (
                      <li key={c.id} className="flex flex-col gap-2">
                        {priv && <DetailCheck secret={priv.secretDetail} answer={c.helper_detail} compact />}
                        <Link href={demoOwner ? "/messages" : `/messages/${c.id}`} className="btn-secondary self-start px-4 py-2 text-sm">
                          {isUnread(c.last_message_at, c.poster_read_at) ? "Read new message" : "Open conversation"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {suggestions.length > 0 && (
                <section aria-labelledby="maybe">
                  <h2 id="maybe" className="font-display text-xl font-extrabold">
                    {report.kind === "lost" ? "Found pets that might be yours" : "Lost pets that might match"}
                  </h2>
                  <div className="mt-3 grid gap-3">
                    {suggestions.map((m) => (
                      <ReportCard key={m.report.id} report={m.report} note={m.reasons.join(" · ")} />
                    ))}
                  </div>
                </section>
              )}

              <section className="flex flex-wrap gap-2" aria-label="Update this post">
                {report.status === "open" ? (
                  <>
                    <form action={setReportStatus}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="reunited" />
                      <button className="btn-primary" disabled={demoOwner}>
                        {report.kind === "lost" ? "We are reunited!" : "Returned to their owner"}
                      </button>
                    </form>
                    <form action={setReportStatus}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="closed" />
                      <button className="btn-quiet" disabled={demoOwner}>
                        Take this post down
                      </button>
                    </form>
                  </>
                ) : (
                  <form action={setReportStatus}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="status" value="open" />
                    <button className="btn-secondary">Reopen this post</button>
                  </form>
                )}
              </section>
            </>
          ) : (
            report.status === "open" && (
              <section className="card p-6" aria-labelledby="respond">
                <h2 id="respond" className="font-display text-xl font-extrabold">
                  {report.kind === "lost" ? `Seen ${petLabel}?` : "Is this your pet?"}
                </h2>
                <div className="mt-4">
                  {isDemo() ? (
                    <p className="text-muted">
                      In demo mode, replies are off.{" "}
                      <Link href={`/lost-found/${report.id}?view=owner`} className="font-semibold text-ember underline">
                        See what the {report.kind === "lost" ? "owner" : "finder"} sees
                      </Link>
                      .
                    </p>
                  ) : viewer ? (
                    <RespondForm reportId={report.id} kind={report.kind} petLabel={petLabel} />
                  ) : (
                    <Link href={`/sign-in?next=/lost-found/${report.id}`} className="btn-primary">
                      Sign in to reply privately
                    </Link>
                  )}
                </div>
              </section>
            )
          )}

          {isStaff && !isOwner && priv && (
            <section className="rounded-3xl border-2 border-pine p-6" aria-labelledby="staff">
              <h2 id="staff" className="font-display text-xl font-extrabold">
                For shelter staff
              </h2>
              <p className="mt-1 text-sm">
                Exact spot: {priv.exact.lat.toFixed(5)}, {priv.exact.lng.toFixed(5)}. Private ID detail:{" "}
                <strong>{priv.secretDetail}</strong>. Use it to confirm a match with an intake before contacting the poster.
              </p>
            </section>
          )}

          <section className="rounded-3xl bg-cream-dim p-6 text-sm">
            <h2 className="font-semibold">{report.kind === "lost" ? "Help bring them home" : "Microchips"}</h2>
            <p className="mt-1">
              {report.kind === "lost"
                ? "If you see this pet, note the time and place and message the owner here. Many scared pets run from strangers; do not chase."
                : "Any vet or animal shelter can scan a found pet for a microchip, for free. If there is a chip, they can reach the owner directly."}
            </p>
            <p className="mt-2 font-semibold text-ember-dark">Never send money to anyone before a pet is safely back. Find Me never asks you to pay.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

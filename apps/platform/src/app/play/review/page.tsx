import type { Metadata } from "next";
import Link from "next/link";
import gallery from "@/data/launch-gallery.json";
import { checkApprovalToken } from "@/lib/trail-crew-approval-link";
import { allReports } from "@/lib/launch-qa-db";
import ReviewList from "./ReviewList";

/**
 * The teacher's QA review: every report from /play, pending first, with
 * Approve (the team sees it) and Hide. The signed "qa" link is the credential.
 */
export const metadata: Metadata = { title: "Play: review QA", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const checked = checkApprovalToken(token);
  const names = Object.fromEntries((gallery as Array<{ slug: string; productName: string; teamName?: string }>).map((e) => [e.slug, `${e.productName} (${e.teamName ?? e.slug})`]));

  if (!checked.ok || checked.claims.scope !== "qa") {
    const why = !checked.ok && checked.reason === "expired"
      ? "That link has expired."
      : !checked.ok && checked.reason === "no_secret"
        ? "Email links are not switched on for this site yet (TRAIL_CREW_APPROVAL_SECRET is not set)."
        : "That is not a QA review link.";
    return (
      <section className="bg-stone-white">
        <div className="container-page py-14">
          <h1 className="font-display text-3xl font-bold text-ink">This link will not open the QA reports</h1>
          <p className="mt-3 text-ink/75">{why}</p>
          <p className="mt-6">
            <Link href="/play/teacher" className="btn-primary">
              Get a fresh link
            </Link>
          </p>
        </div>
      </section>
    );
  }

  const reports = await allReports();
  return (
    <section className="bg-stone-white">
      <div className="container-page py-10">
        <p className="eyebrow">Play and QA</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">QA reports</h1>
        <p className="mt-2 max-w-2xl text-ink/75">
          Approve what a team should see. It shows up on /play for that team under &ldquo;What testers found&rdquo;. Hide anything unkind or off topic.
        </p>
        {reports === null ? (
          <p className="mt-6 text-ink/70">The reports table is not reachable. Check that migration 0046_launch_qa has been applied.</p>
        ) : (
          <ReviewList token={token ?? ""} reports={reports} names={names} />
        )}
      </div>
    </section>
  );
}

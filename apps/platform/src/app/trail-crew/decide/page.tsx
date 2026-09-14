import type { Metadata } from "next";
import Link from "next/link";
import { checkApprovalToken } from "@/lib/trail-crew-approval-link";
import { getEdit, listEdits, teamLabel } from "@/lib/trail-crew-edits";
import { publishingIsConfigured } from "@/lib/trail-crew-publish";
import { TrailCrewQueue } from "@/components/TrailCrewQueue";
import { QueueLinkRequest } from "../teacher/QueueLinkRequest";

/**
 * The decision page the teacher's email opens.
 *
 * No sign-in: the token in the link is the credential, and it names either one
 * proposal or the whole queue. The page only shows and decides what the token
 * covers. Opening it does nothing; Approve and Reject are buttons, because
 * mail scanners open links and a link that acted on being opened would be
 * acted on by a robot.
 */
export const metadata: Metadata = {
  title: "Trail Crew: decide",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DecidePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const checked = checkApprovalToken(token);

  if (!checked.ok) {
    const why =
      checked.reason === "expired"
        ? "That link has expired."
        : checked.reason === "no_secret"
          ? "Email links are not switched on for this site yet (TRAIL_CREW_APPROVAL_SECRET is not set)."
          : "That link is not one this site made.";
    return (
      <Shell title="This link will not open the queue">
        <p className="mt-3 max-w-xl text-ink/75">{why}</p>
        {checked.reason !== "no_secret" && (
          <div className="mt-6">
            <QueueLinkRequest />
          </div>
        )}
        <p className="mt-6 text-sm text-ink/60">
          Or, signed in as staff,{" "}
          <Link href="/execution/trail-crew" className="underline">
            open the queue in the portal
          </Link>
          .
        </p>
      </Shell>
    );
  }

  const items =
    checked.claims.scope === "one" && checked.claims.id
      ? [await getEdit(checked.claims.id)].filter((e): e is NonNullable<typeof e> => !!e)
      : await listEdits("pending");
  const pending = items.filter((e) => e.status === "pending");
  const decided = items.filter((e) => e.status !== "pending");

  return (
    <Shell
      title={checked.claims.scope === "one" ? "A proposal to decide" : `Waiting on you${pending.length > 0 ? ` (${pending.length})` : ""}`}
    >
      <p className="mt-3 max-w-2xl text-ink/75">
        Approving a story commits it, rewrites its build card, and asks Spark to draft the
        architecture change back into this queue. Approving an architecture draft commits the
        page. You can edit the text before approving.
      </p>

      {!publishingIsConfigured() && (
        <p className="mt-5 max-w-2xl rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-3 text-sm text-ink/80">
          <strong>Approving is switched off.</strong> The server has no <code>GITHUB_TOKEN</code>, so it
          cannot commit. You can still read and reject. Set the token on Vercel and this notice goes away.
        </p>
      )}

      {pending.length === 0 ? (
        <p className="mt-6 text-ink/60">
          {decided.length > 0 ? `Already ${decided[0].status}.` : "Nothing pending."}
          {checked.claims.scope === "one" && (
            <>
              {" "}
              <QueueLinkRequest inline />
            </>
          )}
        </p>
      ) : (
        <TrailCrewQueue token={token} items={pending.map((e) => ({ ...e, label: teamLabel(e.team_slug) }))} />
      )}

      {checked.claims.scope === "one" && pending.length > 0 && (
        <p className="mt-8 text-sm text-ink/60">
          This link opens only this proposal. <QueueLinkRequest inline />
        </p>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Trail Crew</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">{title}</h1>
        {children}
      </div>
    </section>
  );
}

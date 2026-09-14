import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import Link from "next/link";
import { listEdits, teamLabel } from "@/lib/trail-crew-edits";
import { publishingIsConfigured } from "@/lib/trail-crew-publish";
import { getAllProgress } from "@/lib/trail-crew-progress";
import { latestDesignLinks } from "@/lib/trail-crew-design-links";
import { TrailCrewQueue } from "@/components/TrailCrewQueue";
import { TrailCrewBoardReset } from "@/components/TrailCrewBoardReset";

export const metadata = { title: "Trail Crew: story changes" };
export const dynamic = "force-dynamic";

/**
 * The approval queue. Staff only.
 *
 * Flagged proposals are listed with everything else rather than hidden. The
 * screening pass tags, it never decides: a real proposal from a twelve year old
 * who worked up the nerve to write it must not disappear because a model
 * thought it was a joke.
 */
export default async function TrailCrewQueuePage() {
  const role = await getCurrentRole();
  if (role && !isStaffRole(role)) redirect("/portal");

  const [pending, recent, progress, designs] = await Promise.all([
    listEdits("pending"),
    listEdits("approved"),
    getAllProgress(),
    latestDesignLinks(),
  ]);
  const boards = Object.values(progress).sort((a, b) => a.productName.localeCompare(b.productName));

  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Trail Crew</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Story changes</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Teams propose changes to their own user stories from their build cards
          and the story studio. Nothing changes until you approve it. Approving a
          story commits it, rewrites that story&rsquo;s build card from it in the
          same breath, and puts a Spark draft of the architecture change back in
          this queue for you. Approving that draft commits the page. The prototype,
          test plan and gap guide catch up on the next deploy.
        </p>

        {!publishingIsConfigured() && (
          <p className="mt-5 max-w-2xl rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-3 text-sm text-ink/80">
            <strong>Approving is switched off.</strong> It writes to the repository
            and needs <code>GITHUB_TOKEN</code> set. You can still read and reject
            what is here.
          </p>
        )}

        <h2 className="mt-10 font-display text-xl font-bold text-ink">
          Waiting on you{pending.length > 0 ? ` (${pending.length})` : ""}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-ink/60">Nothing pending. </p>
        ) : (
          <TrailCrewQueue
            items={pending.map((e) => ({ ...e, label: teamLabel(e.team_slug) }))}
          />
        )}

        <h2 className="mt-14 font-display text-xl font-bold text-ink">Project boards</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          What each team has ticked off on their build cards, live. Teams tick their own
          boxes with no approval; this is where you see it, and where you can wipe a board
          that was ticked for sport.
        </p>
        {boards.length === 0 ? (
          <p className="mt-3 text-ink/60">No team has build cards yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((b) => (
              <li key={b.slug} className="rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm">
                <Link href={`/trail-crew/${b.slug}/board`} className="font-medium text-blaze-maroon underline underline-offset-2">
                  {b.productName}
                </Link>
                <span className="block text-ink/70">
                  {b.doneCards} of {b.totalCards} cards done, {b.doneCriteria} of {b.totalCriteria} lines ticked
                </span>
              </li>
            ))}
          </ul>
        )}
        <TrailCrewBoardReset teams={boards.map((b) => ({ slug: b.slug, label: b.productName }))} />

        <h2 className="mt-14 font-display text-xl font-bold text-ink">Shared designs</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          The latest Figma file and Anvil app each team has handed over. Links stay here and
          in the email; nothing on a student page shows them. To review one, run{" "}
          <code className="rounded bg-ink/5 px-1.5 py-0.5 text-xs">/design-review &lt;team&gt;</code>{" "}
          in Claude Code with the Figma connector on.
        </p>
        {designs.length === 0 ? (
          <p className="mt-3 text-ink/60">No team has shared a design yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {designs.map((d) => (
              <li key={d.id} className="rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm">
                <span className="font-medium text-ink">{teamLabel(d.team_slug)}</span>
                <span className="ml-2 text-xs text-hokie-gray">{new Date(d.created_at).toLocaleDateString()}</span>
                <span className="ml-3">
                  {d.figma_url && (
                    <a href={d.figma_url} className="text-blaze-maroon underline underline-offset-2" target="_blank" rel="noopener">
                      Figma
                    </a>
                  )}
                  {d.figma_url && d.anvil_url && " · "}
                  {d.anvil_url && (
                    <a href={d.anvil_url} className="text-blaze-maroon underline underline-offset-2" target="_blank" rel="noopener">
                      Anvil app
                    </a>
                  )}
                </span>
                {d.note && <span className="block text-ink/70">{d.note}</span>}
              </li>
            ))}
          </ul>
        )}

        {recent.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-xl font-bold text-ink">Already approved</h2>
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 15).map((e) => (
                <li key={e.id} className="text-sm text-ink/70">
                  <span className="font-medium text-ink">{teamLabel(e.team_slug)}</span>
                  {e.kind === "architecture" ? " architecture updated after " : e.kind === "new" ? " added " : " changed "}
                  <span className="font-medium">{e.story_heading}</span>
                  {e.decided_at ? ` on ${new Date(e.decided_at).toLocaleDateString()}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import { listEdits, teamLabel } from "@/lib/trail-crew-edits";
import { publishingIsConfigured } from "@/lib/trail-crew-publish";
import { TrailCrewQueue } from "@/components/TrailCrewQueue";

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

  const [pending, recent] = await Promise.all([listEdits("pending"), listEdits("approved")]);

  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Trail Crew</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Story changes</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Teams propose changes to their own user stories from their build cards.
          Nothing changes until you approve it. Approving commits the new wording
          to the repository, and the team&rsquo;s prototype and coach notes catch
          up on the next deploy.
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

        {recent.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-xl font-bold text-ink">Already approved</h2>
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 15).map((e) => (
                <li key={e.id} className="text-sm text-ink/70">
                  <span className="font-medium text-ink">{teamLabel(e.team_slug)}</span>
                  {" changed "}
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

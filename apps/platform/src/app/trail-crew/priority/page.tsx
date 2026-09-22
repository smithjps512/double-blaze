import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import { getPriorityBoard } from "@/lib/trail-crew-testing";
import gallery from "@/data/prototype-gallery.json";
import { PriorityBoard } from "./PriorityBoard";

/**
 * The priority board: every open bug the testers found, in the order to fix
 * them.
 *
 * The order is the engine's rule, printed on every row so a team can check
 * it: where the teacher put it, how bad the tester said it was, how many
 * times its card failed, how many re-tests found it still there, then oldest
 * first. A teacher signed in as staff can move a bug to now, next or later;
 * everybody else reads. A bug leaves this board one way: somebody runs its
 * steps again on the test page and it passes.
 *
 * `?period=1` narrows it to one period's teams, `?team=slug` to one team.
 * Team and product names only. Nothing here identifies a student.
 */
export const metadata: Metadata = {
  title: "Trail Crew: bugs to fix",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface Entry {
  slug: string;
  productName: string;
}

const PERIODS = ["1", "2", "4", "7"];

export default async function PriorityPage({ searchParams }: { searchParams: Promise<{ period?: string; team?: string }> }) {
  const { period, team } = await searchParams;
  const role = await getCurrentRole();
  const staff = isStaffRole(role);
  const prefix = team ? team : period && PERIODS.includes(period) ? `period-${period}-` : undefined;
  const rows = await getPriorityBoard(prefix);
  const entry = team ? (gallery as Entry[]).find((e) => e.slug === team) : undefined;

  const scope = entry ? entry.productName : period && PERIODS.includes(period) ? `Period ${period}` : "Every team";

  return (
    <div className="bg-stone-white">
      <section className="border-b border-ink/10 bg-white">
        <div className="container-page py-10 md:py-12">
          <p className="eyebrow">Trail Crew</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            Bugs to fix
            <span className="block text-lg font-normal text-hokie-gray">{scope}</span>
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">
            Every open bug a tester found, top to bottom in the order to fix them. The
            order is a rule, and it is written on every row so you can check it: what your
            teacher said, how bad the tester said it was, how often its card fails, how
            often a re-test found it still there, then oldest first. A bug comes off this
            board one way: fix it, then run the steps again on the test page and have it pass.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blaze-maroon">
            <Link href="/trail-crew/priority" className={`underline underline-offset-2 hover:text-trail-orange ${!prefix ? "font-semibold" : ""}`}>
              Every team
            </Link>
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/trail-crew/priority?period=${p}`}
                className={`underline underline-offset-2 hover:text-trail-orange ${period === p && !team ? "font-semibold" : ""}`}
              >
                Period {p}
              </Link>
            ))}
            {entry && (
              <Link href={`/trail-crew/${entry.slug}/test`} className="underline underline-offset-2 hover:text-trail-orange">
                Test {entry.productName}
              </Link>
            )}
            <Link href="/trail-crew" className="underline underline-offset-2 hover:text-trail-orange">
              All teams
            </Link>
          </p>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        {rows.length === 0 ? (
          <p className="max-w-2xl text-ink/70">
            No open bugs here. Either nobody has tested yet, or every bug found has been
            re-tested and passed. Both are worth knowing which.
          </p>
        ) : (
          <PriorityBoard
            staff={staff}
            rows={rows.map((r) => ({
              rank: r.rank,
              id: r.bug.id,
              teamSlug: r.teamSlug,
              productName: r.productName,
              cardNumber: r.card?.number ?? null,
              cardTitle: r.card?.title ?? null,
              title: r.bug.title,
              steps: r.bug.steps ?? null,
              severity: r.bug.severity,
              teacherPriority: r.bug.teacherPriority ?? null,
              stillHappened: r.state.stillHappened,
              reportedAt: r.bug.reportedAt,
              why: r.why,
            }))}
          />
        )}
      </section>
    </div>
  );
}

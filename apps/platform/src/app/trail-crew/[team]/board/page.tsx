import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import gallery from "@/data/prototype-gallery.json";
import { getTeamProgress } from "@/lib/trail-crew-progress";
import { ProjectBoard } from "./ProjectBoard";

/**
 * A team's project board: their build cards, with the boxes that actually
 * stay ticked.
 *
 * The cards page is a static file, so a checkbox on it forgets itself on
 * reload, and a team that ticked three boxes and lost them does not tick them
 * again. This page reads the same cards out of the committed build documents
 * and keeps the ticks in the database, per team, with no sign in. It is the
 * one page in Trail Crew that changes during a lesson rather than between
 * them.
 *
 * Team and product names only. Nothing here identifies a student.
 */
export const dynamic = "force-dynamic";

interface Entry {
  slug: string;
  productName: string;
  teamName?: string;
  href: string;
  buildHref?: string;
  designHref?: string;
  testPlanHref?: string;
  gapHref?: string;
  stage?: string;
  next?: string;
}

const STAGE_LABEL: Record<string, string> = {
  plan: "Product plan",
  stories: "User stories",
  cards: "Build cards",
  architecture: "Architecture",
  build: "Figma and Anvil",
};

export async function generateMetadata({ params }: { params: Promise<{ team: string }> }): Promise<Metadata> {
  const { team } = await params;
  const entry = (gallery as Entry[]).find((e) => e.slug === team);
  return {
    title: entry ? `${entry.productName}: project board` : "Project board",
    robots: { index: false, follow: false },
  };
}

export default async function BoardPage({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  const entry = (gallery as Entry[]).find((e) => e.slug === team);
  const progress = entry ? await getTeamProgress(team) : null;
  if (!entry || !progress) notFound();

  const base = `/prototypes/${team}`;

  return (
    <div className="bg-stone-white">
      <section className="border-b border-ink/10 bg-white">
        <div className="container-page py-10 md:py-12">
          <p className="eyebrow">Trail Crew</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            {entry.productName}
            <span className="block text-lg font-normal text-hokie-gray">project board</span>
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">
            One row per build card. Tick a line when it is true on the screen, not
            when you think it is nearly true. The ticks are your team&rsquo;s, they stay
            ticked for everybody, and your teacher can see them.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blaze-maroon">
            <a href={`${base}/cards.html`} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              Build cards
            </a>
            <a href={`${base}/architecture.html`} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              Architecture
            </a>
            <a href="/build/patterns.html" className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              Pattern Book
            </a>
            {entry.testPlanHref && (
              <a href={entry.testPlanHref} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
                Test plan
              </a>
            )}
            {entry.designHref && (
              <a href={entry.designHref} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
                Design brief
              </a>
            )}
            <a href={entry.href} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              Prototype
            </a>
            <Link href="/trail-crew" className="underline underline-offset-2 hover:text-trail-orange">
              All teams
            </Link>
          </p>
          {entry.next && (
            <p className="mt-5 max-w-2xl rounded-lg border border-trail-orange/40 bg-trail-orange/5 px-4 py-3 text-sm text-ink/80">
              <span className="font-semibold uppercase tracking-wide text-trail-orange">
                {STAGE_LABEL[entry.stage ?? ""] ?? "Next"}:
              </span>{" "}
              {entry.next}{" "}
              {entry.gapHref && (
                <a href={entry.gapHref} className="underline" target="_blank" rel="noopener">
                  What next
                </a>
              )}
            </p>
          )}
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        {progress.cards.length === 0 ? (
          <p className="max-w-2xl text-ink/70">
            This team has no build cards yet, so there is nothing to tick. A card
            arrives by itself the moment your teacher approves a story, or go and{" "}
            <Link href="/trail-crew/write" className="underline">
              write one
            </Link>
            .
          </p>
        ) : (
          <ProjectBoard
            team={team}
            initial={{
              doneCards: progress.doneCards,
              totalCards: progress.totalCards,
              doneCriteria: progress.doneCriteria,
              totalCriteria: progress.totalCriteria,
              cards: progress.cards.map((c) => ({
                slug: c.card.slug,
                number: c.card.number,
                title: c.card.title,
                story: c.card.story ?? null,
                buildIt: c.card.buildIt ?? null,
                criteria: c.card.criteria,
                done: c.done,
                state: c.state,
              })),
            }}
          />
        )}
      </section>
    </div>
  );
}

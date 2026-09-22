import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import gallery from "@/data/prototype-gallery.json";
import { getTeamTesting } from "@/lib/trail-crew-testing";
import { shapeTesting } from "@/lib/trail-crew-testing-shape";
import { TestSheet } from "./TestSheet";

/**
 * A team's user test sheet, live.
 *
 * The same five parts as the paper sheet, in the same order, with the cards
 * already on it. What a tester records lands on the card it was about, on the
 * project board, and on the class priority board, straight away. Nobody signs
 * in: the sheet is numbered for the team, not named for the tester.
 *
 * Team and product names only. Nothing here identifies a student.
 */
export const dynamic = "force-dynamic";

interface Entry {
  slug: string;
  productName: string;
  teamName?: string;
  buildHref?: string;
  demoHref?: string;
}

export async function generateMetadata({ params }: { params: Promise<{ team: string }> }): Promise<Metadata> {
  const { team } = await params;
  const entry = (gallery as Entry[]).find((e) => e.slug === team);
  return {
    title: entry ? `${entry.productName}: test sheet` : "Test sheet",
    robots: { index: false, follow: false },
  };
}

export default async function TestPage({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  const entry = (gallery as Entry[]).find((e) => e.slug === team);
  const testing = entry ? await getTeamTesting(team) : null;
  if (!entry || !testing) notFound();

  const base = `/prototypes/${team}`;

  return (
    <div className="bg-stone-white">
      <section className="border-b border-ink/10 bg-white">
        <div className="container-page py-10 md:py-12">
          <p className="eyebrow">Trail Crew</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            {entry.productName}
            <span className="block text-lg font-normal text-hokie-gray">user test sheet</span>
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">
            Test this app the way a real user would and write down what happened. Every
            card below is a promise the team wrote. Do what the story says, check the
            Done when lines, and say whether it passed. Pass means it did exactly what
            the lines say; nearly is a fail with a note about what was different.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blaze-maroon">
            {entry.demoHref && (
              <a href={entry.demoHref} className="font-semibold underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
                Open the app
              </a>
            )}
            <a href={`${base}/cards.html`} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              Build cards
            </a>
            <a href={`${base}/test-sheet.html`} className="underline underline-offset-2 hover:text-trail-orange" target="_blank" rel="noopener">
              The paper sheet
            </a>
            <Link href={`/trail-crew/${team}/board`} className="underline underline-offset-2 hover:text-trail-orange">
              Project board
            </Link>
            <Link href={`/trail-crew/priority?team=${team}`} className="underline underline-offset-2 hover:text-trail-orange">
              Bugs to fix
            </Link>
            <Link href="/trail-crew" className="underline underline-offset-2 hover:text-trail-orange">
              All teams
            </Link>
          </p>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        {testing.cards.length === 0 ? (
          <p className="max-w-2xl text-ink/70">
            This team has no build cards yet, so there is nothing to test against. Ask them
            for their stories.
          </p>
        ) : (
          <TestSheet team={team} initial={shapeTesting(testing)} />
        )}
      </section>
    </div>
  );
}

import type { BugState, CardVerdict, TeamTesting } from "@double-blaze/prototype-forge";
import type { BuildCard } from "@double-blaze/prototype-forge";

/**
 * What the live test sheet and the project board receive over the wire.
 *
 * Kept apart from `trail-crew-testing.ts` because that module is server only
 * and the client components need these types. Nothing here identifies a
 * student; a bug's words are the tester's, and the tester is a number.
 */

export interface BugView {
  id: string;
  cardSlug: string | null;
  title: string;
  steps: string | null;
  severity: 1 | 2 | 3 | null;
  teacherPriority: "now" | "next" | "later" | null;
  reportedAt: string;
  /** Re-tests that found it still there. */
  stillHappened: number;
  fixedAt: string | null;
}

export interface CardTestingView {
  slug: string;
  number: number;
  title: string;
  story: string | null;
  criteria: string[];
  passes: number;
  fails: number;
  verdict: CardVerdict;
  latestOutcome: "pass" | "fail" | null;
  openBugs: BugView[];
  fixedBugs: BugView[];
}

export interface TeamTestingShape {
  slug: string;
  productName: string;
  cards: CardTestingView[];
  unplacedBugs: BugView[];
  sheets: number;
  passes: number;
  fails: number;
  openBugs: number;
  fixedBugs: number;
}

export function bugView(state: BugState): BugView {
  return {
    id: state.bug.id,
    cardSlug: state.bug.cardSlug,
    title: state.bug.title,
    steps: state.bug.steps ?? null,
    severity: state.bug.severity,
    teacherPriority: state.bug.teacherPriority ?? null,
    reportedAt: state.bug.reportedAt,
    stillHappened: state.stillHappened,
    fixedAt: state.fixedBy?.testedAt ?? null,
  };
}

export function shapeTesting(input: {
  slug: string;
  productName: string;
  cards: BuildCard[];
  summary: TeamTesting;
  sheets: { length: number };
}): TeamTestingShape {
  const s = input.summary;
  return {
    slug: input.slug,
    productName: input.productName,
    cards: s.cards.map((c) => ({
      slug: c.card.slug,
      number: c.card.number,
      title: c.card.title,
      story: c.card.story ?? null,
      criteria: c.card.criteria,
      passes: c.passes,
      fails: c.fails,
      verdict: c.verdict,
      latestOutcome: c.latest?.outcome ?? null,
      openBugs: c.openBugs.map(bugView),
      fixedBugs: c.fixedBugs.map(bugView),
    })),
    unplacedBugs: s.unplacedBugs.map(bugView),
    sheets: input.sheets.length,
    passes: s.passes,
    fails: s.fails,
    openBugs: s.openBugs,
    fixedBugs: s.fixedBugs,
  };
}

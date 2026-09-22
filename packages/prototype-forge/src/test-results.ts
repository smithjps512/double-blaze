/**
 * Test results, read back onto the cards, and the bugs put in an order.
 *
 * A team's build cards are promises. A user test sheet is somebody checking
 * them, one card at a time, and writing down what happened. This module is
 * what happens next: the results land on the card they were about, every open
 * bug lands on a board in an order a student can check on paper, and a bug
 * leaves that board only when the same test is run again and passes.
 *
 * Deterministic like everything else in the engine. There is no judgement
 * here about how bad a bug is; the tester said how bad it was, the teacher can
 * move it, and the rule for everything else is written out in words on every
 * row so that "why is ours at the top" has an answer the team can read.
 *
 * Nothing here knows about a database. The host reads rows, hands them in,
 * and shows what comes out.
 */

import type { BuildCard } from "./cards";

export type TestOutcome = "pass" | "fail";

/** How bad, from the sheet: 1 small, 2 annoying, 3 cannot continue. */
export type Severity = 1 | 2 | 3;

/** Where a teacher put a bug by hand. Unset means the rule decides. */
export type TeacherPriority = "now" | "next" | "later";

/**
 * One line of a test sheet: somebody did what a card says and it passed or
 * failed. A result that names a bug is a re-test of that bug: they did the
 * steps again, and it either happened again (fail) or it did not (pass).
 */
export interface CardResult {
  id: string;
  cardSlug: string;
  /** Set when this result is a re-test of one bug rather than of the card. */
  bugId?: string | null;
  outcome: TestOutcome;
  whatIDid?: string | null;
  whatHappened?: string | null;
  /** ISO 8601. Results are ordered by this, so it has to be the time of the test. */
  testedAt: string;
}

/** One row of "Bugs you found", or a broken break-it test. */
export interface Bug {
  id: string;
  /** Null when the tester could not say which card, or it is about the whole app. */
  cardSlug: string | null;
  title: string;
  steps?: string | null;
  severity: Severity | null;
  teacherPriority?: TeacherPriority | null;
  /** ISO 8601. */
  reportedAt: string;
}

export type BugStatus = "open" | "fixed";

/** A bug with what the results say about it. */
export interface BugState {
  bug: Bug;
  status: BugStatus;
  /** How many times somebody re-ran the steps and it still happened. */
  stillHappened: number;
  /** The passing re-test that closed it, when there is one. */
  fixedBy?: CardResult;
}

export type CardVerdict = "untested" | "passing" | "failing";

export interface CardTesting {
  card: BuildCard;
  passes: number;
  fails: number;
  /** The newest card-level result, which is what the card reads as now. */
  latest?: CardResult;
  openBugs: BugState[];
  fixedBugs: BugState[];
  /**
   * What the card reads as. Failing when its newest test failed or it has an
   * open bug; passing when it has been tested and has neither; untested
   * otherwise. A card that reads as failing should not read as done, whatever
   * its ticks say, because somebody has looked at it and it was not.
   */
  verdict: CardVerdict;
}

export interface TeamTesting {
  cards: CardTesting[];
  /** Bugs that name no card. They are still on the board. */
  unplacedBugs: BugState[];
  passes: number;
  fails: number;
  openBugs: number;
  fixedBugs: number;
  /** True once anything at all has been recorded. */
  tested: boolean;
}

/**
 * Which bugs are fixed and which are open, from the results alone.
 *
 * A bug is fixed by a passing re-test of that bug recorded after it was
 * reported, and by nothing else: not by a tick, not by a teacher, not by a
 * card passing for somebody who never tried the steps. That is the rule the
 * team asked for, and it keeps the board honest. Re-tests that failed are
 * counted, because "it still happens after three tries" is a different fact
 * from "it happened once".
 */
export function bugStates(bugs: Bug[], results: CardResult[]): BugState[] {
  const byBug = new Map<string, CardResult[]>();
  for (const r of results) {
    if (!r.bugId) continue;
    const list = byBug.get(r.bugId) ?? [];
    list.push(r);
    byBug.set(r.bugId, list);
  }
  return bugs.map((bug) => {
    const retests = (byBug.get(bug.id) ?? [])
      .filter((r) => r.testedAt >= bug.reportedAt)
      .sort((a, b) => a.testedAt.localeCompare(b.testedAt));
    const fixedBy = retests.find((r) => r.outcome === "pass");
    const stillHappened = retests.filter((r) => r.outcome === "fail" && (!fixedBy || r.testedAt < fixedBy.testedAt)).length;
    return fixedBy ? { bug, status: "fixed", stillHappened, fixedBy } : { bug, status: "open", stillHappened };
  });
}

/**
 * Every result and every bug, placed on the card it was about.
 *
 * Card-level results (the ones with no bug) decide the pass and fail counts
 * and the latest outcome. Re-tests of a bug decide only that bug. Results
 * that name a card the team no longer has are dropped rather than invented a
 * home for, which is what happens to a tick on a reworded criterion too.
 */
export function summariseTesting(cards: BuildCard[], results: CardResult[], bugs: Bug[]): TeamTesting {
  const states = bugStates(bugs, results);
  const slugs = new Set(cards.map((c) => c.slug));

  const perCard: CardTesting[] = cards.map((card) => {
    const mine = results
      .filter((r) => r.cardSlug === card.slug && !r.bugId)
      .sort((a, b) => a.testedAt.localeCompare(b.testedAt));
    const passes = mine.filter((r) => r.outcome === "pass").length;
    const fails = mine.filter((r) => r.outcome === "fail").length;
    const latest = mine[mine.length - 1];
    const bugsHere = states.filter((s) => s.bug.cardSlug === card.slug);
    const openBugs = bugsHere.filter((s) => s.status === "open");
    const fixedBugs = bugsHere.filter((s) => s.status === "fixed");
    const verdict: CardVerdict =
      openBugs.length > 0 || latest?.outcome === "fail" ? "failing" : latest ? "passing" : "untested";
    return { card, passes, fails, latest, openBugs, fixedBugs, verdict };
  });

  const unplacedBugs = states.filter((s) => s.bug.cardSlug === null || !slugs.has(s.bug.cardSlug));

  return {
    cards: perCard,
    unplacedBugs,
    passes: perCard.reduce((n, c) => n + c.passes, 0),
    fails: perCard.reduce((n, c) => n + c.fails, 0),
    openBugs: states.filter((s) => s.status === "open").length,
    fixedBugs: states.filter((s) => s.status === "fixed").length,
    tested: results.length > 0 || bugs.length > 0,
  };
}

/** A bug on the priority board, with its place and the reason for it in words. */
export interface RankedBug {
  rank: number;
  bug: Bug;
  state: BugState;
  /** The team the bug belongs to, when the board holds more than one. */
  team?: string;
  card?: BuildCard;
  /** How many card-level fails the bug's card has, which is the tie-break. */
  cardFails: number;
  /** The rule, applied to this row, in one sentence a student can check. */
  why: string;
}

export interface RankInput {
  /** A label for the team, shown on a board that mixes teams. */
  team?: string;
  cards: BuildCard[];
  results: CardResult[];
  bugs: Bug[];
}

const PRIORITY_ORDER: Record<TeacherPriority | "none", number> = { now: 0, next: 1, none: 2, later: 3 };

const PRIORITY_WORDS: Record<TeacherPriority, string> = {
  now: "Your teacher put this at the top.",
  next: "Your teacher said this comes next.",
  later: "Your teacher said this can wait.",
};

function severityWords(s: Severity | null): string {
  if (s === 3) return "The tester could not continue (3)";
  if (s === 2) return "The tester found it annoying (2)";
  if (s === 1) return "The tester called it small (1)";
  return "The tester did not say how bad it was";
}

/**
 * Every open bug across one or many teams, in the order to fix them.
 *
 * The rule, top to bottom, and a student can apply it with a pencil:
 *
 * 1. Where the teacher put it: now, then next, then everything the teacher
 *    did not touch, then later.
 * 2. How bad the tester said it was: 3, then 2, then 1, then not said.
 * 3. How many times its card failed a test. A bug on a card that keeps
 *    failing is worth more than the same bug on a card that mostly passes.
 * 4. How many times a re-test found it still there.
 * 5. Oldest first. A bug that has waited longest goes ahead of a new one that
 *    ties with it on everything else.
 *
 * Fixed bugs are not on the board. They are on the card, under "fixed".
 */
export function rankBugs(inputs: RankInput[]): RankedBug[] {
  const rows: Omit<RankedBug, "rank" | "why">[] = [];
  for (const input of inputs) {
    const summary = summariseTesting(input.cards, input.results, input.bugs);
    const failsByCard = new Map(summary.cards.map((c) => [c.card.slug, c.fails]));
    const cardsBySlug = new Map(input.cards.map((c) => [c.slug, c]));
    for (const state of bugStates(input.bugs, input.results)) {
      if (state.status !== "open") continue;
      const card = state.bug.cardSlug ? cardsBySlug.get(state.bug.cardSlug) : undefined;
      rows.push({
        bug: state.bug,
        state,
        team: input.team,
        card,
        cardFails: card ? (failsByCard.get(card.slug) ?? 0) : 0,
      });
    }
  }

  rows.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.bug.teacherPriority ?? "none"];
    const pb = PRIORITY_ORDER[b.bug.teacherPriority ?? "none"];
    if (pa !== pb) return pa - pb;
    const sa = a.bug.severity ?? 0;
    const sb = b.bug.severity ?? 0;
    if (sa !== sb) return sb - sa;
    if (a.cardFails !== b.cardFails) return b.cardFails - a.cardFails;
    if (a.state.stillHappened !== b.state.stillHappened) return b.state.stillHappened - a.state.stillHappened;
    return a.bug.reportedAt.localeCompare(b.bug.reportedAt);
  });

  return rows.map((row, i) => {
    const parts: string[] = [];
    if (row.bug.teacherPriority) parts.push(PRIORITY_WORDS[row.bug.teacherPriority]);
    parts.push(`${severityWords(row.bug.severity)}.`);
    if (row.card) {
      parts.push(
        row.cardFails === 0
          ? `Its card has not failed a test.`
          : `Its card failed ${row.cardFails} ${row.cardFails === 1 ? "test" : "tests"}.`,
      );
    } else {
      parts.push("It is not about one card.");
    }
    if (row.state.stillHappened > 0) {
      parts.push(
        `Re-tested ${row.state.stillHappened} ${row.state.stillHappened === 1 ? "time" : "times"} and it still happened.`,
      );
    }
    return { ...row, rank: i + 1, why: parts.join(" ") };
  });
}

/** What the verdict says in words, for a badge. */
export const VERDICT_LABEL: Record<CardVerdict, string> = {
  untested: "Not tested yet",
  passing: "Passing",
  failing: "Failing",
};

/**
 * The six "try to break it" rows from the test sheet, shared with the live
 * sheet so a broken one becomes a bug with the same words on it.
 */
export const BREAK_IT_TESTS = [
  "Leave a box empty and press the button anyway.",
  "Type letters where a number should go (a price, a score, a distance).",
  "Press the same button twice, fast.",
  "Refresh the page in the middle of doing something. Is your stuff still there?",
  "Turn the phone sideways, or make the window very narrow.",
  "Search for something that does not exist.",
] as const;

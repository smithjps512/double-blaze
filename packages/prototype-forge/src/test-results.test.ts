/**
 * The results module decides what a card reads as and what order the bugs go
 * in, and both are things a team will argue about. So the cases here are the
 * arguments: a bug only closes on a passing re-test, a teacher's "now" beats
 * a tester's 3, and a tie is broken by who waited longest.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseCards } from "./cards";
import { bugStates, rankBugs, summariseTesting, type Bug, type CardResult } from "./test-results";

const CARDS = parseCards(`# Strive: build cards

## Card 3: Start a run

**Your story.** As a runner, I want to start a run.

**Done when:**
- [ ] The Run button is on the home screen
- [ ] Stop saves the run

## Card 5: Chatroom

**Your story.** As a consumer, I want to chat.

**Done when:**
- [ ] The chatroom shows everyone's posts

## Card 6: Credits and background colors

**Your story.** As a fitness person, I want backgrounds.

**Done when:**
- [ ] Buying a background applies it everywhere
`);

const at = (day: number, hour = 9) => `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00Z`;

const result = (o: Partial<CardResult> & { cardSlug: string; outcome: "pass" | "fail" }): CardResult => ({
  id: o.id ?? `${o.cardSlug}-${o.testedAt ?? "x"}-${o.outcome}`,
  testedAt: at(18),
  ...o,
});

const bug = (o: Partial<Bug> & { id: string; title: string }): Bug => ({
  cardSlug: null,
  severity: null,
  reportedAt: at(18),
  ...o,
});

test("results land on their card, and the newest one is what the card reads as", () => {
  const s = summariseTesting(
    CARDS,
    [
      result({ cardSlug: "start-a-run", outcome: "pass", testedAt: at(18, 9) }),
      result({ cardSlug: "start-a-run", outcome: "fail", testedAt: at(18, 10) }),
      result({ cardSlug: "chatroom", outcome: "pass", testedAt: at(18, 9) }),
    ],
    [],
  );
  const run = s.cards.find((c) => c.card.slug === "start-a-run")!;
  assert.equal(run.passes, 1);
  assert.equal(run.fails, 1);
  assert.equal(run.latest?.outcome, "fail");
  assert.equal(run.verdict, "failing");
  assert.equal(s.cards.find((c) => c.card.slug === "chatroom")!.verdict, "passing");
  assert.equal(s.cards.find((c) => c.card.slug === "credits-and-background-colors")!.verdict, "untested");
  assert.equal(s.tested, true);
});

test("an open bug makes its card read as failing even when the card's own test passed", () => {
  const s = summariseTesting(
    CARDS,
    [result({ cardSlug: "credits-and-background-colors", outcome: "pass" })],
    [bug({ id: "b1", title: "White background hides the text", cardSlug: "credits-and-background-colors", severity: 2 })],
  );
  const card = s.cards.find((c) => c.card.slug === "credits-and-background-colors")!;
  assert.equal(card.verdict, "failing");
  assert.equal(card.openBugs.length, 1);
  assert.equal(s.openBugs, 1);
});

test("a bug closes on a passing re-test of that bug, and on nothing else", () => {
  const b = bug({ id: "b1", title: "Cannot see friends' messages", cardSlug: "chatroom", severity: 3, reportedAt: at(18) });
  // The card passing for somebody else does not close it.
  let states = bugStates([b], [result({ cardSlug: "chatroom", outcome: "pass", testedAt: at(19) })]);
  assert.equal(states[0].status, "open");
  // A failed re-test keeps it open and is counted.
  states = bugStates([b], [result({ cardSlug: "chatroom", bugId: "b1", outcome: "fail", testedAt: at(19) })]);
  assert.equal(states[0].status, "open");
  assert.equal(states[0].stillHappened, 1);
  // A passing re-test before it was reported is not a re-test of it.
  states = bugStates([b], [result({ cardSlug: "chatroom", bugId: "b1", outcome: "pass", testedAt: at(17) })]);
  assert.equal(states[0].status, "open");
  // A passing re-test after it closes it.
  states = bugStates([b], [
    result({ cardSlug: "chatroom", bugId: "b1", outcome: "fail", testedAt: at(19) }),
    result({ cardSlug: "chatroom", bugId: "b1", outcome: "pass", testedAt: at(20) }),
  ]);
  assert.equal(states[0].status, "fixed");
  assert.equal(states[0].stillHappened, 1);
  assert.equal(states[0].fixedBy?.testedAt, at(20));
});

test("a fixed bug leaves the card's open list and the card can pass again", () => {
  const s = summariseTesting(
    CARDS,
    [
      result({ cardSlug: "chatroom", outcome: "fail", testedAt: at(18) }),
      result({ cardSlug: "chatroom", bugId: "b1", outcome: "pass", testedAt: at(20) }),
      result({ cardSlug: "chatroom", outcome: "pass", testedAt: at(21) }),
    ],
    [bug({ id: "b1", title: "Cannot see friends' messages", cardSlug: "chatroom", severity: 3 })],
  );
  const card = s.cards.find((c) => c.card.slug === "chatroom")!;
  assert.equal(card.openBugs.length, 0);
  assert.equal(card.fixedBugs.length, 1);
  assert.equal(card.verdict, "passing");
  assert.equal(s.fixedBugs, 1);
});

test("a bug about no card, or a card the team no longer has, is unplaced but still counted", () => {
  const s = summariseTesting(CARDS, [], [
    bug({ id: "b1", title: "Home bar hidden at the top", cardSlug: null, severity: 1 }),
    bug({ id: "b2", title: "Old card", cardSlug: "a-card-that-was-deleted", severity: 2 }),
  ]);
  assert.equal(s.unplacedBugs.length, 2);
  assert.equal(s.openBugs, 2);
  assert.ok(s.cards.every((c) => c.openBugs.length === 0));
});

test("the board order: teacher's word, then severity, then the card's fails, then re-tests, then age", () => {
  const results = [
    result({ cardSlug: "chatroom", outcome: "fail", testedAt: at(18, 9) }),
    result({ cardSlug: "chatroom", outcome: "fail", testedAt: at(18, 10) }),
    result({ cardSlug: "credits-and-background-colors", outcome: "fail", testedAt: at(18, 9) }),
    result({ cardSlug: "start-a-run", bugId: "retested", outcome: "fail", testedAt: at(19) }),
  ];
  const bugs: Bug[] = [
    bug({ id: "small-old", title: "Small and old", cardSlug: "start-a-run", severity: 1, reportedAt: at(10) }),
    bug({ id: "small-new", title: "Small and new", cardSlug: "start-a-run", severity: 1, reportedAt: at(18) }),
    bug({ id: "later", title: "Teacher said later", cardSlug: "chatroom", severity: 3, teacherPriority: "later", reportedAt: at(11) }),
    bug({ id: "sev3-one-fail", title: "Bad, card failed once", cardSlug: "credits-and-background-colors", severity: 3, reportedAt: at(12) }),
    bug({ id: "sev3-two-fails", title: "Bad, card failed twice", cardSlug: "chatroom", severity: 3, reportedAt: at(13) }),
    bug({ id: "now", title: "Teacher said now", cardSlug: null, severity: 1, teacherPriority: "now", reportedAt: at(17) }),
    bug({ id: "unsaid", title: "No severity", cardSlug: null, severity: null, reportedAt: at(9) }),
    bug({ id: "retested", title: "Small, still happens", cardSlug: "start-a-run", severity: 1, reportedAt: at(18) }),
    bug({ id: "fixed", title: "Already fixed", cardSlug: "chatroom", severity: 3, reportedAt: at(1) }),
  ];
  results.push(result({ cardSlug: "chatroom", bugId: "fixed", outcome: "pass", testedAt: at(2) }));

  const ranked = rankBugs([{ team: "Strive Fitness", cards: CARDS, results, bugs }]);
  assert.deepEqual(
    ranked.map((r) => r.bug.id),
    ["now", "sev3-two-fails", "sev3-one-fail", "retested", "small-old", "small-new", "unsaid", "later"],
  );
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].why, "Your teacher put this at the top. The tester called it small (1). It is not about one card.");
  assert.equal(ranked[1].why, "The tester could not continue (3). Its card failed 2 tests.");
  assert.equal(ranked[3].why, "The tester called it small (1). Its card has not failed a test. Re-tested 1 time and it still happened.");
  assert.equal(ranked[7].why, "Your teacher said this can wait. The tester could not continue (3). Its card failed 2 tests.");
  assert.ok(!ranked.some((r) => r.bug.id === "fixed"));
});

test("a board that mixes teams keeps each bug's team and card", () => {
  const ranked = rankBugs([
    { team: "A", cards: CARDS, results: [], bugs: [bug({ id: "a", title: "A's bug", cardSlug: "chatroom", severity: 2 })] },
    { team: "B", cards: CARDS, results: [], bugs: [bug({ id: "b", title: "B's bug", cardSlug: "chatroom", severity: 3 })] },
  ]);
  assert.deepEqual(ranked.map((r) => [r.team, r.bug.id, r.card?.title]), [
    ["B", "b", "Chatroom"],
    ["A", "a", "Chatroom"],
  ]);
});

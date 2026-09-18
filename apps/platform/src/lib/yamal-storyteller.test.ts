import assert from "node:assert/strict";
import { test } from "node:test";
import { SEASONS, SPAIN_TOTAL, TEAMS, clubTotals } from "@/data/yamal";
import { factsText, VOICE } from "./yamal-storyteller-prompt";

/**
 * The storyteller may only say what the facts block says, so the checks are
 * that the block carries everything the pages show, and that the voice sets
 * the rules the classroom needs.
 */

test("the facts block names every team and every season", () => {
  const facts = factsText();
  for (const t of TEAMS) assert.ok(facts.includes(t.name), `missing team ${t.name}`);
  for (const s of SEASONS) assert.ok(facts.includes(`${s.label}`), `missing season ${s.label}`);
});

test("the facts block carries the career totals the tiles show", () => {
  const facts = factsText();
  const club = clubTotals();
  assert.ok(facts.includes(`${club.apps} games, ${club.goals} goals, ${club.assists} assists`));
  assert.ok(facts.includes(`${SPAIN_TOTAL.caps} caps and ${SPAIN_TOTAL.goals} goals`));
});

test("derived rows are labelled as derived in the facts", () => {
  const facts = factsText();
  const derivedCount = SEASONS.flatMap((s) => s.lines).filter((l) => l.derived).length;
  const labelled = facts.split("derived by subtraction").length - 1;
  assert.equal(labelled, derivedCount);
});

test("the voice forbids first person and invention, and bans em dashes", () => {
  const v = VOICE;
  assert.match(v, /not Lamine Yamal/);
  assert.match(v, /Never speak as him/);
  assert.match(v, /must come from the FACTS/);
  assert.match(v, /No em dashes/);
});

test("no em dashes in the facts block or the voice", () => {
  assert.ok(!factsText().includes("—"));
  assert.ok(!VOICE.includes("—"));
});

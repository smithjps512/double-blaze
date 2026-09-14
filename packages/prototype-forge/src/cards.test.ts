/**
 * The cards module edits documents that a teacher wrote with a team by hand,
 * and it is the first thing in the chain that rewrites one of them without a
 * person reading the result first. So the cases here are about not losing
 * anything: a teacher's note survives, a renumbered card keeps its ticks, and
 * a story that changed is found by its heading before its sentence.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseStories } from "./parse";
import {
  cardDrift,
  cardForStory,
  cardFromStory,
  cardsFromStories,
  parseCards,
  proseOf,
  sameSentence,
  stampCardUpdated,
  storySentence,
  upsertCardForStory,
} from "./cards";

const CARDS = `# Classic Cars: build cards

Team: Classic Cars.

**Read this first.** Three of these were drafted with your teacher.

---

## Card 1: Car gallery

**Your story.** As somebody who likes cars, I want to look through cool cars and
their stats, so that I can see which ones are fastest and why.

**Done when:**
- [x] Every car shows its name and a picture
- [ ] Clicking a car shows its year, top speed and horsepower
- [ ] You can get back to the list

**Build it:** Architecture, Feature 1. **Build this one first.**

**Your job before you code:** pick the cars. Five is plenty to start.

---

## Card 2: Quiz

**Your story.** As a user, I want to take a quiz, so that I can test my knowledge.

**Done when:**
- [ ] It tells you how many you got right

**Build it:** Architecture, Feature 4.

---

## A note for the whole team

Your app has no stubbed features.
`;

const STORIES = `# Classic Cars user stories

## Car gallery

As somebody who likes cars, I want to look through cool cars and their stats, so
that I can see which ones are fastest and why.

  - Every car shows its name and a picture
  - Clicking a car shows its year, top speed and horsepower
  - You can get back to the list

## Quiz

As a user, I want to take a quiz, so that I can test my knowledge.

  - It tells you how many you got right
  - You can press submit when you are done

## Parts library

As somebody who likes cars, I want to read what each part does, so that I understand what is under the hood.

  Given I want to know what a turbo does
  When I click turbo in the parts list
  Then I see a short page explaining it
`;

test("parseCards reads numbered cards and leaves notes alone", () => {
  const cards = parseCards(CARDS);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].number, 1);
  assert.equal(cards[0].title, "Car gallery");
  assert.equal(cards[0].slug, "car-gallery");
  assert.match(cards[0].story ?? "", /^As somebody who likes cars, I want to look through cool cars and their stats, so that/);
  assert.deepEqual(cards[0].criteria, [
    "Every car shows its name and a picture",
    "Clicking a car shows its year, top speed and horsepower",
    "You can get back to the list",
  ]);
  assert.deepEqual(cards[0].checked, [true, false, false]);
  assert.match(cards[0].buildIt ?? "", /Feature 1/);
});

test("a card is found by the story's heading first, then by its sentence", () => {
  const cards = parseCards(CARDS);
  const stories = parseStories(STORIES);
  assert.equal(cardForStory(cards, stories[0])?.number, 1);
  assert.equal(cardForStory(cards, stories[1])?.number, 2);
  assert.equal(cardForStory(cards, stories[2]), undefined);
});

test("sameSentence forgives wrapping, case and punctuation", () => {
  assert.ok(sameSentence("As a user, I want a quiz.", "as a user i want a quiz"));
  assert.ok(!sameSentence("As a user, I want a quiz.", "As a user, I want a test."));
});

test("cardDrift names the card whose criteria fell behind and the story with no card", () => {
  const drift = cardDrift(parseStories(STORIES), parseCards(CARDS));
  assert.equal(drift.length, 2);
  assert.match(drift[0].reason, /Card 2 is missing a criterion/);
  assert.match(drift[0].reason, /press submit/);
  assert.equal(drift[1].story.featureHint, "Parts library");
  assert.equal(drift[1].reason, "has no build card");
});

test("storySentence rebuilds the sentence the card quotes", () => {
  const [story] = parseStories(STORIES);
  assert.equal(
    storySentence(story),
    "As somebody who likes cars, I want to look through cool cars and their stats, so that I can see which ones are fastest and why.",
  );
});

test("proseOf keeps the teacher's paragraphs and drops the derived ones", () => {
  const [card] = parseCards(CARDS);
  const prose = proseOf(card);
  assert.equal(prose.length, 1);
  assert.match(prose[0], /Your job before you code/);
});

test("upsertCardForStory rewrites the finish line and keeps the number, build line and note", () => {
  const stories = parseStories(STORIES);
  const { markdown, action } = upsertCardForStory(CARDS, stories[1]);
  assert.equal(action, "replaced");
  const cards = parseCards(markdown);
  assert.equal(cards[1].number, 2);
  assert.deepEqual(cards[1].criteria, [
    "It tells you how many you got right",
    "You can press submit when you are done",
  ]);
  assert.match(cards[1].buildIt ?? "", /Feature 4/);
  // The rest of the file is untouched.
  assert.match(markdown, /Read this first/);
  assert.match(markdown, /A note for the whole team/);
  assert.match(markdown, /Your job before you code/);
  assert.equal(cardDrift(stories.slice(0, 2), cards).length, 0);
});

test("upsertCardForStory appends a card for a story that has none, numbered after the last", () => {
  const stories = parseStories(STORIES);
  const { markdown, action } = upsertCardForStory(CARDS, stories[2]);
  assert.equal(action, "appended");
  const cards = parseCards(markdown);
  assert.equal(cards.length, 3);
  assert.equal(cards[2].number, 3);
  assert.equal(cards[2].title, "Parts library");
  // A story with only scenarios gets its Then lines as the finish line.
  assert.deepEqual(cards[2].criteria, ["I see a short page explaining it"]);
});

test("cardFromStory says so when a story has no finish line at all", () => {
  const [story] = parseStories("## Thin\n\nAs a user, I want a thing, so that it works.\n");
  const card = cardFromStory(story, { number: 9 });
  assert.match(card, /## Card 9: Thin/);
  assert.match(card, /no acceptance criteria yet/);
});

test("cardsFromStories makes a whole page for a team with none", () => {
  const page = cardsFromStories(parseStories(STORIES), { productName: "Classic Cars", teamName: "Classic Cars" });
  const cards = parseCards(page);
  assert.equal(cards.length, 3);
  assert.equal(cards[0].number, 1);
  assert.equal(cards[2].number, 3);
  assert.match(page, /^# Classic Cars: build cards/);
});

test("stampCardUpdated writes the date after the team line and replaces an old one", () => {
  const stamped = stampCardUpdated("# X\n\nTeam: Y.\n\n## Card 1: A\n", new Date("2026-09-14T12:00:00Z"));
  assert.match(stamped, /Team: Y\.\n\nCard updated: 2026-09-14\n/);
  const again = stampCardUpdated(stamped, new Date("2026-10-01T12:00:00Z"));
  assert.equal((again.match(/Card updated/g) ?? []).length, 1);
  assert.match(again, /Card updated: 2026-10-01/);
});

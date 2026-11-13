import { test } from "node:test";
import assert from "node:assert/strict";
import { dealbreaker, rankAnimals, scoreAnimal } from "./matching";
import { DEFAULT_ANSWERS, parseAnswers, type Answers } from "./quiz";
import { DEMO_ANIMALS } from "./demo-data";
import type { Animal } from "./types";

const base: Animal = {
  id: "a",
  shelterId: "s",
  species: "dog",
  name: "Test",
  sex: "male",
  ageGroup: "adult",
  ageLabel: "",
  size: "medium",
  breed: "",
  energy: 2,
  coatCare: 1,
  trainingNeeds: 1,
  goodWithKids: "yes",
  goodWithDogs: "yes",
  goodWithCats: "yes",
  needsYard: false,
  aloneOk: 3,
  specialNeeds: "",
  bio: "",
  photoUrl: null,
  fee: null,
  status: "available",
  intakeDate: "2026-01-01",
};
const animal = (o: Partial<Animal>): Animal => ({ ...base, ...o });
const answers = (o: Partial<Answers>): Answers => ({ ...DEFAULT_ANSWERS, ...o });

test("a perfect fit scores 100", () => {
  assert.equal(scoreAnimal(base, DEFAULT_ANSWERS).score, 100);
});

test("unavailable animals are excluded", () => {
  assert.ok(dealbreaker(animal({ status: "adopted" }), DEFAULT_ANSWERS));
  assert.ok(dealbreaker(animal({ status: "on_hold" }), DEFAULT_ANSWERS));
});

test("species preference filters, either does not", () => {
  assert.ok(dealbreaker(animal({ species: "cat" }), answers({ species: "dog" })));
  assert.equal(dealbreaker(animal({ species: "cat" }), answers({ species: "either" })), null);
});

test("household 'no' is a dealbreaker; 'unknown' is a question, not a filter", () => {
  assert.ok(dealbreaker(animal({ goodWithKids: "no" }), answers({ kids: "under10" })));
  assert.equal(dealbreaker(animal({ goodWithKids: "no" }), answers({ kids: "over10" })), null);
  assert.ok(dealbreaker(animal({ goodWithCats: "no" }), answers({ hasCats: true })));
  assert.equal(dealbreaker(animal({ goodWithCats: "unknown" }), answers({ hasCats: true })), null);
  const m = scoreAnimal(animal({ goodWithCats: "unknown" }), answers({ hasCats: true }));
  assert.ok(m.reasons.some((r) => r.tone === "ask" && r.text.includes("cats")));
});

test("housing size limit applies to dogs only", () => {
  assert.ok(dealbreaker(animal({ size: "large" }), answers({ maxSize: "medium" })));
  assert.equal(dealbreaker(animal({ size: "medium" }), answers({ maxSize: "medium" })), null);
  assert.equal(dealbreaker(animal({ species: "cat", size: "large" }), answers({ maxSize: "small" })), null);
});

test("long days away rule out animals that need company", () => {
  assert.ok(dealbreaker(animal({ aloneOk: 1 }), answers({ hoursAway: "long" })));
  assert.equal(dealbreaker(animal({ aloneOk: 1 }), answers({ hoursAway: "short" })), null);
});

test("energy mismatch lowers the score", () => {
  const calm = answers({ activity: 1 });
  assert.ok(scoreAnimal(animal({ energy: 3 }), calm).score < scoreAnimal(animal({ energy: 1 }), calm).score);
});

test("a first-time owner scores lower on high training needs, an expert does not", () => {
  const hard = animal({ trainingNeeds: 3 });
  assert.ok(scoreAnimal(hard, answers({ experience: 1 })).score < scoreAnimal(hard, answers({ experience: 3 })).score);
  assert.equal(scoreAnimal(hard, answers({ experience: 3 })).score, 100);
});

test("breed never changes the score", () => {
  const a = scoreAnimal(animal({ breed: "Pit bull mix" }), DEFAULT_ANSWERS).score;
  const b = scoreAnimal(animal({ breed: "Golden retriever" }), DEFAULT_ANSWERS).score;
  assert.equal(a, b);
});

test("scores stay within 0 to 100 even with every bonus", () => {
  const m = scoreAnimal(base, answers({ kids: "over10", hasDogs: true, hasCats: true }));
  assert.ok(m.score <= 100 && m.score >= 0);
});

test("ranking sorts best first and splits out dealbreakers", () => {
  const { matches, excluded } = rankAnimals(DEMO_ANIMALS, answers({ species: "dog", kids: "under10" }));
  assert.ok(matches.length > 0);
  for (let i = 1; i < matches.length; i++) assert.ok(matches[i - 1].score >= matches[i].score);
  assert.ok(matches.every((m) => m.animal.species === "dog"));
  assert.ok(excluded.some((e) => e.animal.name === "Ziggy"));
  assert.equal(matches.length + excluded.length, DEMO_ANIMALS.length);
});

test("parseAnswers survives junk and old shapes", () => {
  const a = parseAnswers({ species: "lizard", activity: "9", sizes: "small,huge", maxSize: "none", hasCats: "yes" });
  assert.equal(a.species, "either");
  assert.equal(a.activity, DEFAULT_ANSWERS.activity);
  assert.deepEqual(a.sizes, ["small"]);
  assert.equal(a.maxSize, null);
  assert.equal(a.hasCats, true);
  assert.deepEqual(parseAnswers(null), DEFAULT_ANSWERS);
});

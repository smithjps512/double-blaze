import { test } from "node:test";
import assert from "node:assert/strict";
import { PROMPTS, TOTAL_MIN_WORDS, checkReflection, emptyDraft, looksPadded, missing, promptStatus, wordCount } from "./reflection";

const words = (n: number) =>
  Array.from({ length: n }, (_, i) => ["sanding", "axle", "the", "nose", "took", "two", "days", "because", "balsa", "splits", "grain", "thin"][i % 12] + i).join(" ");

function finished() {
  const d = emptyDraft();
  d.fullName = "Jordan Rivera";
  d.period = 2;
  for (const k of Object.keys(d.ratings) as Array<keyof typeof d.ratings>) d.ratings[k] = { enjoyed: 4, did: 3 };
  for (const p of PROMPTS) d.answers[p.id] = p.minWords ? words(p.minWords) : "";
  return d;
}

test("every prompt id is unique and the total is a 30 minute assignment", () => {
  assert.equal(new Set(PROMPTS.map((p) => p.id)).size, PROMPTS.length);
  assert.ok(TOTAL_MIN_WORDS >= 700, `only ${TOTAL_MIN_WORDS} words`);
});

test("wordCount ignores punctuation-only tokens", () => {
  assert.equal(wordCount("  I sanded it - twice ...  "), 4);
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount("1.25 seconds"), 2);
});

test("padded answers are caught, real ones are not", () => {
  assert.equal(looksPadded("very ".repeat(40)), true);
  const sentence = "my car was slow because the axle holes were crooked and it rubbed the body. ";
  assert.equal(looksPadded(sentence.repeat(4)), true);
  assert.equal(looksPadded(words(60)), false);
  assert.equal(looksPadded("short short short"), false);
});

test("a finished draft has nothing missing and passes the server check", () => {
  const d = finished();
  assert.deepEqual(missing(d), []);
  const r = checkReflection(d);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.fullName, "Jordan Rivera");
    assert.equal(r.value.words, TOTAL_MIN_WORDS);
  }
});

test("the server refuses short answers, one-word names and bad ratings", () => {
  const short = finished();
  short.answers.liked = "It was fun.";
  assert.equal(checkReflection(short).ok, false);
  assert.ok(missing(short).some((m) => m.startsWith("3.1")));

  const name = finished();
  name.fullName = "Jordan";
  assert.equal(checkReflection(name).ok, false);

  const rating = finished() as unknown as { ratings: Record<string, { enjoyed: unknown; did: unknown }> };
  rating.ratings.race = { enjoyed: 9, did: 3 };
  assert.equal(checkReflection(rating).ok, false);

  assert.equal(checkReflection(null).ok, false);
  assert.equal(checkReflection("hi").ok, false);
});

test("the optional question never blocks turning in", () => {
  const p = PROMPTS.find((x) => x.id === "anything_else")!;
  assert.equal(promptStatus(p, ""), "optional");
});

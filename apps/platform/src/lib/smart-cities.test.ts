import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { SMART_CITIES, checkAnswer, checkInitials, checkPlayerKey, checkScore, findCity, isMode } from "./smart-cities.js";

const DEMO = join(dirname(fileURLToPath(import.meta.url)), "../../public/demo/period-3-smart-cities");

describe("the city registry", () => {
  it("asks the same questions, in the same order, as each city page", () => {
    for (const city of SMART_CITIES) {
      const html = readFileSync(join(DEMO, city.slug, "index.html"), "utf8");
      for (const q of city.questions) assert.ok(html.includes(q), `${city.slug} page is missing: ${q}`);
    }
  });

  it("finds cities and their games", () => {
    const city = findCity("solar-city");
    assert.ok(city);
    assert.equal(isMode(city, "dispatch"), true);
    assert.equal(isMode(city, "power"), false);
    assert.equal(findCity("../etc"), null);
  });
});

describe("checkInitials", () => {
  it("accepts two or three letters and upper-cases them", () => {
    assert.deepEqual(checkInitials(" jb "), { ok: true, initials: "JB" });
    assert.deepEqual(checkInitials("abc"), { ok: true, initials: "ABC" });
  });
  it("refuses anything else", () => {
    for (const bad of ["A", "ABCD", "A1", "", "J.B", 42, null]) assert.equal(checkInitials(bad).ok, false, String(bad));
  });
  it("refuses words that should not go on a class screen", () => {
    assert.equal(checkInitials("ass").ok, false);
    assert.equal(checkInitials("KKK").ok, false);
  });
});

describe("checkScore", () => {
  it("rounds a score in range", () => assert.deepEqual(checkScore(512.6), { ok: true, score: 513 }));
  it("refuses impossible scores", () => {
    for (const bad of [-1, 1001, Number.NaN, Infinity, "900"]) assert.equal(checkScore(bad).ok, false, String(bad));
  });
});

describe("checkPlayerKey", () => {
  it("wants a random URL-safe token", () => {
    assert.equal(checkPlayerKey("abcDEF123_-abcDEF12"), "abcDEF123_-abcDEF12");
    assert.equal(checkPlayerKey("short"), null);
    assert.equal(checkPlayerKey("has spaces in it here!!"), null);
  });
});

describe("checkAnswer", () => {
  it("accepts an answer to a real question", () => {
    const r = checkAnswer({ city: "romanville", question: 3, answer: "  It should check the weight. ", writer: "designer" });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.answer, "It should check the weight.");
      assert.equal(r.writer, "designer");
    }
  });
  it("treats anything but designer as a classmate", () => {
    const r = checkAnswer({ city: "romanville", question: 0, answer: "Solar panels", writer: "teacher" });
    assert.equal(r.ok && r.writer, "classmate");
  });
  it("refuses a missing city, question or answer", () => {
    assert.equal(checkAnswer({ city: "nope", question: 0, answer: "hello" }).ok, false);
    assert.equal(checkAnswer({ city: "solar-city", question: 6, answer: "hello" }).ok, false);
    assert.equal(checkAnswer({ city: "solar-city", question: 1.5, answer: "hello" }).ok, false);
    assert.equal(checkAnswer({ city: "solar-city", question: 0, answer: "  " }).ok, false);
    assert.equal(checkAnswer({ city: "solar-city", question: 0, answer: "x".repeat(501) }).ok, false);
  });
});

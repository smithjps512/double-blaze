import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkReport, formFor, ideaAsStory, ownApp } from "./qa.js";

const base = { app: "p3-da-purples", period: 3, team: "Pickle bombs" };

describe("qa reports", () => {
  it("takes a complete bug report", () => {
    const r = checkReport({ ...base, kind: "bug", answers: { screen: "Map", did: "Tapped C101 twice", happened: "The route vanished", expected: "The route to C101" } });
    assert.ok(r.ok);
    assert.equal(r.ok && r.report.teamKey, "pickle-bombs");
    assert.deepEqual(r.ok && Object.keys(r.report.answers), ["screen", "did", "happened", "expected"]);
  });

  it("asks for each required step, and names the box", () => {
    const r = checkReport({ ...base, kind: "bug", answers: { did: "Tapped C101", happened: "Nothing" } });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.field, "expected");
  });

  it("does not need a screen", () => {
    assert.ok(checkReport({ ...base, kind: "love", answers: { happened: "The crowd colors are so cool" } }).ok);
  });

  it("turns away comments about the team instead of the app", () => {
    const r = checkReport({ ...base, kind: "confusing", answers: { did: "play it", happened: "this game is stupid" } });
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.error : "", /what happened/);
  });

  it("refuses an unknown kind, app or period", () => {
    assert.equal(checkReport({ ...base, kind: "rant", answers: {} }).ok, false);
    assert.equal(checkReport({ ...base, app: "../etc", kind: "love", answers: { happened: "good stuff" } }).ok, false);
    assert.equal(checkReport({ ...base, period: 9, kind: "love", answers: { happened: "good stuff" } }).ok, false);
  });

  it("drops answers that are not questions on that form", () => {
    const r = checkReport({ ...base, kind: "love", answers: { happened: "the obby is great", sneaky: "x" } });
    assert.ok(r.ok && !("sneaky" in r.report.answers));
  });

  it("knows a reviewer's own app, and turns an idea into a story", () => {
    assert.equal(ownApp(3, "Da purples"), "p3-da-purples");
    assert.deepEqual(ideaAsStory({ asA: "student", iWant: "trade cards", soThat: "finish my set" }), { asA: "student", iWant: "trade cards", soThat: "finish my set", feature: "" });
    assert.equal(formFor("idea").questions.length, 3);
  });
});

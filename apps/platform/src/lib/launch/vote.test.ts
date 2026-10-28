import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POLL, checkBallot, tally } from "./vote.js";

const base = { poll: POLL.id, period: 3, team: "Da purples", why: "I want to make my app even better" };

describe("ballots", () => {
  it("takes a full ranking", () => {
    const r = checkBallot({ ...base, ranking: ["game-studio", "apps-v2", "smart-city"] });
    assert.ok(r.ok);
    assert.equal(r.ok && r.ballot.teamKey, "da-purples");
  });

  it("needs every option exactly once", () => {
    assert.equal(checkBallot({ ...base, ranking: ["apps-v2", "apps-v2", "smart-city"] }).ok, false);
    assert.equal(checkBallot({ ...base, ranking: ["apps-v2", "smart-city"] }).ok, false);
    assert.equal(checkBallot({ ...base, ranking: ["apps-v2", "smart-city", "nope"] }).ok, false);
  });

  it("needs a reason of one sentence", () => {
    assert.equal(checkBallot({ ...base, why: "ok", ranking: ["apps-v2", "smart-city", "game-studio"] }).ok, false);
    assert.equal(checkBallot({ ...base, why: "x".repeat(201), ranking: ["apps-v2", "smart-city", "game-studio"] }).ok, false);
  });

  it("turns away unkind or rude reasons", () => {
    const r = checkBallot({ ...base, why: "the others are boring", ranking: ["apps-v2", "smart-city", "game-studio"] });
    assert.equal(r.ok, false);
    assert.equal(checkBallot({ ...base, why: "damn right I want games", ranking: ["game-studio", "smart-city", "apps-v2"] }).ok, false);
  });

  it("refuses an unknown poll and period", () => {
    assert.equal(checkBallot({ ...base, poll: "other", ranking: ["apps-v2", "smart-city", "game-studio"] }).ok, false);
    assert.equal(checkBallot({ ...base, period: 0, ranking: ["apps-v2", "smart-city", "game-studio"] }).ok, false);
  });
});

describe("tally", () => {
  it("counts Borda points, firsts and voters", () => {
    const t = tally(POLL, [
      { ranking: ["apps-v2", "smart-city", "game-studio"] },
      { ranking: ["game-studio", "apps-v2", "smart-city"] },
      { ranking: ["apps-v2", "game-studio", "smart-city"] },
    ]);
    assert.equal(t.voters, 3);
    const by = Object.fromEntries(t.results.map((r) => [r.id, r]));
    assert.equal(by["apps-v2"].points, 3 + 2 + 3);
    assert.equal(by["game-studio"].points, 1 + 3 + 2);
    assert.equal(by["smart-city"].points, 2 + 1 + 1);
    assert.equal(by["apps-v2"].firsts, 2);
    assert.equal(t.results[0].id, "apps-v2");
    assert.equal(t.leader, "apps-v2");
  });

  it("has no leader with no votes or a dead heat", () => {
    assert.equal(tally(POLL, []).leader, null);
    const tie = tally(POLL, [
      { ranking: ["apps-v2", "game-studio", "smart-city"] },
      { ranking: ["game-studio", "apps-v2", "smart-city"] },
    ]);
    assert.equal(tie.leader, null);
  });
});

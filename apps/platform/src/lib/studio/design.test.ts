import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanDesign,
  emptyDesign,
  feelingHints,
  loopHints,
  mechanicHints,
  studioLevelUp,
  studioProgress,
  toGameDesignDoc,
  toLevelStories,
  type GameDesign,
} from "./design.js";

const GAME: GameDesign = {
  gameName: "Pickle Panic",
  oneLiner: "It's a platformer where you rescue pickles from a runaway lunch tray",
  feeling: "Brave and a little silly",
  genre: "Platformer",
  players: [
    { name: "Explorers", wants: "secret areas behind walls" },
    { name: "Competitors", wants: "the fastest time on the board" },
  ],
  loop: ["run", "jump", "collect pickles", "reach the jar"],
  win: "Reach the jar on level 3 with at least 10 pickles",
  lose: "Fall off the tray 3 times",
  hero: "Dill, a brave pickle",
  goal: "Get every pickle back in the jar",
  obstacle: "The runaway lunch tray tilts every 5 seconds",
  setting: "The school cafeteria at night",
  intro: "The lunch tray came alive. Dill has to save the others.",
  mechanics: [
    { name: "Jump", controls: "A button", rule: "Jumps 2 tiles high, once per press" },
    { name: "Dash", controls: "B button", rule: "Moves 3 tiles fast, every 2 seconds" },
    { name: "Tilt", controls: "none", rule: "The tray tilts left or right every 5 seconds" },
  ],
  levels: [
    {
      feature: "The tray",
      asA: "player",
      iWant: "jump between tilting trays",
      soThat: "reach the first jar",
      criteria: ["The jump clears a 2 tile gap", "The tray tilts every 5 seconds"],
      scenarios: [
        { kind: "happy", given: "I am on the first tray", when: "I press A as it tilts", then: "I land on the next tray" },
        { kind: "bad", given: "I miss the jump", when: "I fall off the tray", then: "I lose a life and start at the last checkpoint" },
      ],
    },
  ],
};

describe("game design coaching", () => {
  it("asks for a feeling word when the feeling just says what the game is", () => {
    assert.equal(feelingHints("It's a game about pickles")[0].level, "nudge");
    assert.equal(feelingHints("Brave and a little silly")[0].level, "good");
  });

  it("asks for a win, a lose, and enough verbs", () => {
    const hints = loopHints({ ...emptyDesign(), loop: ["run", ""] });
    assert.ok(hints.some((h) => /3 or 4/.test(h.text)));
    assert.ok(hints.some((h) => /win/.test(h.text)));
    assert.ok(hints.some((h) => /lose/.test(h.text)));
    assert.equal(loopHints(GAME)[0].level, "good");
  });

  it("asks for an exact rule a developer can build", () => {
    assert.ok(mechanicHints({ name: "Jump", controls: "A", rule: "you jump high" }).some((h) => /exact/.test(h.text)));
    assert.equal(mechanicHints(GAME.mechanics[0])[0].level, "good");
  });
});

describe("game design level up", () => {
  it("starts an empty design at the pitch", () => {
    assert.equal(studioLevelUp(emptyDesign())[0].id, "pitch");
  });

  it("only asks for more levels once level 1 is done", () => {
    const ids = studioLevelUp(GAME).map((i) => i.id);
    assert.deepEqual(ids, ["levels"]);
    assert.equal(studioProgress(GAME).doneLevels, 1);
  });

  it("sends a level with no bad day to its bad day box", () => {
    const g = { ...GAME, levels: [{ ...GAME.levels[0], scenarios: [GAME.levels[0].scenarios[0]] }] };
    assert.deepEqual(studioLevelUp(g).find((i) => i.id === "l1-bad")?.target, { step: "levels", level: 0, scenario: "bad" });
  });
});

describe("game design export", () => {
  it("survives garbage and keeps a real design", () => {
    assert.doesNotThrow(() => cleanDesign({ players: "x", levels: [null, 3], mechanics: [{ name: 4 }] }));
    assert.deepEqual(cleanDesign(JSON.parse(JSON.stringify(GAME))), GAME);
  });

  it("writes a design doc a builder can work from", () => {
    const md = toGameDesignDoc(GAME, "The Pickle Bombs", 3);
    assert.match(md, /^# Pickle Panic$/m);
    assert.match(md, /run → jump → collect pickles → reach the jar → again/);
    assert.match(md, /\*\*Jump\*\* \(A button\): Jumps 2 tiles high, once per press\./);
    assert.match(md, /\*\*Lose:\*\* Fall off the tray 3 times\./);
  });

  it("writes levels as stories with their checks and scenarios", () => {
    const md = toLevelStories(GAME, "The Pickle Bombs");
    assert.match(md, /^# Levels for Pickle Panic$/m);
    assert.match(md, /As a player, I want to jump between tilting trays, so that I can reach the first jar\./);
    assert.match(md, /^ {2}When I fall off the tray$/m);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { looksLikeCode } from "./trail-crew-guard.js";

/**
 * The guard is the belt to the prompt's braces. The prompt tells the helper not
 * to write code; this catches the day a determined thirteen year old talks it
 * into doing so anyway. It is meant to over-trigger rather than under-trigger:
 * a helper that wrongly withholds one answer costs a student thirty seconds,
 * and a helper that hands out the code costs the whole teaching design.
 */
describe("looksLikeCode", () => {
  it("catches a fenced block", () => {
    assert.equal(looksLikeCode("Sure, here you go:\n```python\nx = 1\n```"), true);
  });

  it("catches the Anvil calls the Pattern Book exists to teach", () => {
    for (const snippet of [
      "You want app_tables.houses.add_row(name='Red')",
      "Just call anvil.server.call('add_points', 5) there",
      "Put @handle('btn_save', 'click') above it",
      "Write def add_points(name): and then continue",
      "You need import anvil.users at the top",
      "Set self.lbl_total = 5 in the handler",
    ]) {
      assert.equal(looksLikeCode(snippet), true, `should have caught: ${snippet}`);
    }
  });

  it("catches an indented block even without a fence", () => {
    assert.equal(looksLikeCode("Try this:\n\n    row = get_row(name)\n"), true);
  });

  it("leaves ordinary teaching answers alone", () => {
    for (const reply of [
      "That is Pattern 7. Your table name is in the Data tables part of your architecture.",
      "Which card are you on? If it is Card 3, your architecture lists the patterns in order.",
      "Sounds like you know the pattern but not the name. Go back to your architecture page.",
      "Nobody has written that story yet, so there is nothing to build from. Worth raising with your teacher.",
      "Have a look at Pattern 14. It is the one about showing and hiding things.",
    ]) {
      assert.equal(looksLikeCode(reply), false, `should have allowed: ${reply}`);
    }
  });
});

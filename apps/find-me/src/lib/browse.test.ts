import { test } from "node:test";
import assert from "node:assert/strict";
import { applyBrowse, parseBrowse } from "./browse";
import { DEMO_ANIMALS } from "./demo-data";

test("parseBrowse ignores junk", () => {
  assert.deepEqual(parseBrowse({ species: "lizard", size: "huge", kids: "yes" }), {
    species: undefined, size: undefined, age: undefined, kids: undefined, dogs: undefined, cats: undefined, shelter: undefined,
  });
  assert.equal(parseBrowse({ species: ["cat", "dog"] }).species, "cat");
});

test("good-with filters keep confirmed yes only", () => {
  const out = applyBrowse(DEMO_ANIMALS, parseBrowse({ cats: "1" }));
  assert.ok(out.length > 0);
  assert.ok(out.every((a) => a.goodWithCats === "yes"));
});

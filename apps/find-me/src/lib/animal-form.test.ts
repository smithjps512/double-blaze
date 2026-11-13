import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAnimalForm, photoProblem } from "./animal-form";

function form(o: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

test("the five required fields are enough, and defaults fill the rest", () => {
  const { value, errors } = parseAnimalForm(form({ name: "Biscuit", species: "dog", sex: "male", ageGroup: "adult", size: "medium" }));
  assert.deepEqual(errors, {});
  assert.equal(value?.goodWithKids, "unknown");
  assert.equal(value?.energy, 2);
  assert.equal(value?.status, "available");
  assert.equal(value?.fee, null);
  assert.equal(value?.needsYard, false);
});

test("cats default to small when size is left out", () => {
  const { value } = parseAnimalForm(form({ name: "Milo", species: "cat", sex: "male", ageGroup: "young" }));
  assert.equal(value?.size, "small");
});

test("missing and invalid fields are reported, not guessed", () => {
  const { value, errors } = parseAnimalForm(form({ species: "lizard", fee: "12.5" }));
  assert.equal(value, undefined);
  for (const k of ["name", "species", "sex", "ageGroup", "fee"]) assert.ok(errors[k], k);
});

test("out-of-range levels fall back instead of failing", () => {
  const { value } = parseAnimalForm(
    form({ name: "X", species: "dog", sex: "female", ageGroup: "baby", size: "small", energy: "7", goodWithCats: "maybe" }),
  );
  assert.equal(value?.energy, 2);
  assert.equal(value?.goodWithCats, "unknown");
});

test("photo checks", () => {
  assert.equal(photoProblem({ size: 1000, type: "image/jpeg" }), null);
  assert.ok(photoProblem({ size: 1000, type: "image/gif" }));
  assert.ok(photoProblem({ size: 9 * 1024 * 1024, type: "image/png" }));
});

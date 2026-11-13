import { test } from "node:test";
import assert from "node:assert/strict";
import { adoptionCode, slugify } from "./shelter-form";

test("slugify", () => {
  assert.equal(slugify("Riverbend Animal Shelter"), "riverbend-animal-shelter");
  assert.equal(slugify("  Cats & Dogs!! "), "cats-and-dogs");
  assert.match(slugify("x".repeat(80)), /^[a-z0-9-]{2,40}$/);
});

test("adoption codes are short, uppercase, and match the database check", () => {
  assert.equal(adoptionCode("Riverbend Animal Shelter"), "RIVERBEND");
  assert.equal(adoptionCode("The Humane Society of Hill County"), "HILL");
  for (const n of ["SPCA", "A", "Montgomery County Animal Care and Adoption Center", "Pets & Pals Rescue"]) {
    assert.match(adoptionCode(n, "2"), /^[A-Z0-9]{4,24}$/, n);
  }
});

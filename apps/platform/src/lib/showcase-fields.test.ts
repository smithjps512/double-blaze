import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CITED_COLUMNS, RESEARCH_FIELDS, claimsSomething, slugify } from "./showcase-fields.js";

/**
 * The citation rule.
 *
 * Half of it is a database constraint, proven against Postgres: a photo cannot
 * be saved without a credit and a source link. The other half spans two tables
 * and cannot be a constraint, so it is this function, and it is the one a
 * student could actually walk around if it were wrong.
 */
describe("claimsSomething", () => {
  it("is false for a car with nothing written on it", () => {
    assert.equal(claimsSomething(null, { name: "Charger", year: 1970 }), false);
  });

  it("is true as soon as any researched field has something in it", () => {
    for (const field of RESEARCH_FIELDS) {
      assert.equal(
        claimsSomething(null, { [field.column]: "something" }),
        true,
        `${field.column} should need a source`,
      );
    }
  });

  it("treats whitespace as empty, because a space is not research", () => {
    assert.equal(claimsSomething(null, { engine: "   \n  " }), false);
  });

  it("still applies when the save itself clears a field", () => {
    // The edit most likely to break a finished page: emptying one box on a car
    // that is already full of claims. Judged on the incoming values alone, this
    // save would look like it claims nothing and would skip the rule.
    const stored = { engine: "7.0 V8", car_history: "Built to go racing." };
    assert.equal(claimsSomething(stored, { engine: "" }), true);
  });

  it("is false when the save empties the last field on a car", () => {
    const stored = { engine: "7.0 V8" };
    assert.equal(claimsSomething(stored, { engine: "" }), false);
  });

  it("covers the older prose field too", () => {
    assert.equal(claimsSomething(null, { special: "The fuel injected one." }), true);
    assert.ok(CITED_COLUMNS.includes("special"));
  });

  it("ignores fields nobody has to cite", () => {
    // A year and a horsepower number come off the stats form, which existed
    // before any of this. Renaming a car is not a claim that needs a footnote.
    assert.equal(
      claimsSomething(null, { name: "Charger", year: 1970, horsepower: 425, sort_order: 2 }),
      false,
    );
  });

  it("every researched field is in the cited list", () => {
    for (const field of RESEARCH_FIELDS) {
      assert.ok(CITED_COLUMNS.includes(field.column), `${field.column} is missing`);
    }
  });
});

describe("slugify", () => {
  it("makes a url out of a car name", () => {
    assert.equal(slugify("1970 Dodge Charger R/T"), "1970-dodge-charger-r-t");
  });

  it("gives a car called nonsense a working page rather than a 404", () => {
    assert.match(slugify("!!!"), /^item-/);
  });
});

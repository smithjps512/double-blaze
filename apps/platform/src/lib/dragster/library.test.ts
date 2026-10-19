import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LIBRARY, findCar } from "./library.js";
import { checkRules, parseSpec, run } from "./sim.js";
import { RULES } from "./rules.js";

describe("the car library", () => {
  it("numbers every car once, from 1 up", () => {
    const nos = LIBRARY.map((c) => c.no);
    assert.deepEqual(nos, nos.map((_, i) => i + 1));
  });

  it("gives the server a car it will accept, for every blueprint", () => {
    for (const car of LIBRARY) {
      const parsed = parseSpec(car.spec);
      assert.ok(parsed.ok, `car ${car.no}: ${parsed.ok ? "" : parsed.error}`);
    }
  });

  it("races every car to the line in a real CO2 time", () => {
    for (const car of LIBRARY) {
      const r = run(car.spec);
      assert.ok(r.time > 0.9 && r.time < 2.2, `car ${car.no} ran ${r.time}`);
    }
  });

  it("keeps estimated mass inside the class rule", () => {
    for (const car of LIBRARY) {
      assert.ok(car.spec.massG >= RULES.mass.min && car.spec.massG <= RULES.mass.max, `car ${car.no}`);
    }
  });

  it("never fails the safety rules out of the box", () => {
    for (const car of LIBRARY) {
      const safety = checkRules(car.spec).filter((r) => r.safety && !r.ok);
      assert.deepEqual(safety.map((r) => r.id), [], `car ${car.no}`);
    }
  });

  it("names no students: nicknames only, and only short ones", () => {
    for (const car of LIBRARY) {
      if (car.nickname) assert.ok(car.nickname.length <= 20, `car ${car.no}`);
    }
  });

  it("finds cars by number only", () => {
    assert.equal(findCar(1)?.no, 1);
    assert.equal(findCar("1"), null);
    assert.equal(findCar(999), null);
  });
});

describe("the length rule", () => {
  it("is 10 to 12 inches", () => {
    assert.equal(RULES.length.min, 254);
    assert.ok(Math.abs(RULES.length.max - 304.8) < 1e-9);
  });
});

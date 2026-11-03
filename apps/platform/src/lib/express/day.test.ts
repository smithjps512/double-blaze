import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { schoolMidnight } from "./day.js";

describe("the school day", () => {
  it("starts at midnight Eastern, in winter and in summer", () => {
    assert.equal(schoolMidnight(new Date("2026-11-04T15:00:00Z")).toISOString(), "2026-11-04T05:00:00.000Z");
    assert.equal(schoolMidnight(new Date("2026-06-01T15:00:00Z")).toISOString(), "2026-06-01T04:00:00.000Z");
  });

  it("puts 11pm Eastern on the same school day, not the next UTC one", () => {
    assert.equal(schoolMidnight(new Date("2026-11-05T03:30:00Z")).toISOString(), "2026-11-04T05:00:00.000Z");
  });
});

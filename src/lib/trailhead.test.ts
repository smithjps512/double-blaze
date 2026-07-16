import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateSubdomain,
  RESERVED_SUBDOMAINS,
  capacityMonthKey,
  nextMonthKey,
  validateTipAmount,
  TIP_MIN_CENTS,
  TIP_MAX_CENTS,
} from "./trailhead.js";

describe("validateSubdomain", () => {
  it("accepts valid subdomains", () => {
    assert.deepStrictEqual(validateSubdomain("my-club"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("abc"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("cool-site-123"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("a1b"), { valid: true });
  });

  it("rejects empty input", () => {
    const r = validateSubdomain("");
    assert.equal(r.valid, false);
  });

  it("rejects uppercase", () => {
    const r = validateSubdomain("MyClub");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("lowercase"));
  });

  it("rejects special characters", () => {
    assert.equal(validateSubdomain("my_club").valid, false);
    assert.equal(validateSubdomain("my.club").valid, false);
    assert.equal(validateSubdomain("my club").valid, false);
    assert.equal(validateSubdomain("my@club").valid, false);
  });

  it("rejects leading hyphen", () => {
    const r = validateSubdomain("-my-club");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("hyphen"));
  });

  it("rejects trailing hyphen", () => {
    const r = validateSubdomain("my-club-");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("hyphen"));
  });

  it("rejects too short (< 3)", () => {
    assert.equal(validateSubdomain("ab").valid, false);
    assert.equal(validateSubdomain("a").valid, false);
  });

  it("rejects too long (> 40)", () => {
    const r = validateSubdomain("a".repeat(41));
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("40"));
  });

  it("accepts exactly 3 and 40 characters", () => {
    assert.equal(validateSubdomain("abc").valid, true);
    assert.equal(validateSubdomain("a".repeat(40)).valid, true);
  });

  it("rejects all reserved subdomains", () => {
    for (const name of RESERVED_SUBDOMAINS) {
      const r = validateSubdomain(name);
      assert.equal(r.valid, false, `Expected "${name}" to be rejected`);
      assert.ok(r.error?.includes("reserved"));
    }
  });
});

describe("capacityMonthKey", () => {
  it("returns YYYY-MM for a given date", () => {
    assert.equal(capacityMonthKey(new Date(2026, 0, 15)), "2026-01");
    assert.equal(capacityMonthKey(new Date(2026, 11, 1)), "2026-12");
  });
});

describe("nextMonthKey", () => {
  it("returns the following month", () => {
    assert.equal(nextMonthKey(new Date(2026, 6, 12)), "2026-08");
  });

  it("rolls over December to January of next year", () => {
    assert.equal(nextMonthKey(new Date(2026, 11, 31)), "2027-01");
  });
});

describe("validateTipAmount", () => {
  it("accepts valid amounts", () => {
    assert.equal(validateTipAmount(10000), null); // $100
    assert.equal(validateTipAmount(TIP_MIN_CENTS), null);
    assert.equal(validateTipAmount(TIP_MAX_CENTS), null);
  });

  it("rejects zero", () => {
    assert.ok(validateTipAmount(0));
  });

  it("rejects negative", () => {
    assert.ok(validateTipAmount(-100));
  });

  it("rejects amounts below minimum", () => {
    assert.ok(validateTipAmount(TIP_MIN_CENTS - 1));
  });

  it("rejects amounts above maximum", () => {
    assert.ok(validateTipAmount(TIP_MAX_CENTS + 1));
  });

  it("rejects non-integer", () => {
    assert.ok(validateTipAmount(100.5));
  });

  it("rejects NaN and Infinity", () => {
    assert.ok(validateTipAmount(NaN));
    assert.ok(validateTipAmount(Infinity));
  });
});

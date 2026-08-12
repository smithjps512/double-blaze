import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateSubdomain,
  resolveSiteSubdomain,
  RESERVED_SUBDOMAINS,
  capacityMonthKey,
  nextMonthKey,
  validateTipAmount,
  TIP_MIN_CENTS,
  TIP_MAX_CENTS,
  statusToStageView,
  stepState,
  isValidStatusToken,
  isPlausibleEmail,
  TRAILHEAD_STAGES,
} from "./trailhead.js";
import type { TrailheadSiteStatus } from "./trailhead.js";

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

describe("resolveSiteSubdomain", () => {
  const DOMAIN = "doubleblaze.solutions";

  it("resolves a customer site subdomain", () => {
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}`, DOMAIN), "my-club");
  });

  it("strips the port used in local dev", () => {
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}:3000`, DOMAIN), "my-club");
  });

  it("is case insensitive, since Host headers are not normalized", () => {
    assert.equal(resolveSiteSubdomain(`My-Club.${DOMAIN}`, DOMAIN), "my-club");
  });

  it("does not resolve the bare domain", () => {
    assert.equal(resolveSiteSubdomain(DOMAIN, DOMAIN), null);
  });

  it("does not resolve a domain that merely ends in the primary domain", () => {
    assert.equal(resolveSiteSubdomain(`notdoubleblaze.solutions`, DOMAIN), null);
  });

  it("does not resolve an unrelated host", () => {
    assert.equal(resolveSiteSubdomain("double-blaze.vercel.app", DOMAIN), null);
    assert.equal(resolveSiteSubdomain("localhost:3000", DOMAIN), null);
  });

  it("does not resolve multi-level subdomains", () => {
    // A wildcard certificate covers exactly one label, so these could never
    // present valid TLS.
    assert.equal(resolveSiteSubdomain(`a.b.${DOMAIN}`, DOMAIN), null);
  });

  it("leaves every reserved subdomain to the app", () => {
    // This is the whole point: a name nobody can claim at intake must not be
    // routed to a customer site lookup either.
    for (const name of RESERVED_SUBDOMAINS) {
      assert.equal(
        resolveSiteSubdomain(`${name}.${DOMAIN}`, DOMAIN),
        null,
        `Expected reserved "${name}" to fall through to app routing`,
      );
    }
  });

  it("leaves www to the app", () => {
    assert.equal(resolveSiteSubdomain(`www.${DOMAIN}`, DOMAIN), null);
  });

  it("honors a non-default primary domain", () => {
    assert.equal(resolveSiteSubdomain("my-club.example.test", "example.test"), "my-club");
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}`, "example.test"), null);
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

describe("statusToStageView", () => {
  it("maps submitted to the drafting stage, waiting on us", () => {
    const v = statusToStageView("submitted");
    assert.equal(v.currentStageId, "drafting");
    assert.equal(v.waitingOn, "us");
    assert.equal(v.special, null);
  });

  it("maps awaiting_approval to the review gate, waiting on the customer", () => {
    const v = statusToStageView("awaiting_approval");
    assert.equal(v.currentStageId, "review");
    assert.equal(v.waitingOn, "you");
  });

  it("maps approved and building to the building stage", () => {
    assert.equal(statusToStageView("approved").currentStageId, "building");
    assert.equal(statusToStageView("building").currentStageId, "building");
    assert.equal(statusToStageView("building").waitingOn, "us");
  });

  it("holds a built site at 'building' until staff releases the preview", () => {
    // preview status, but preview not yet sent: customer must not see the gate.
    const notSent = statusToStageView("preview", false);
    assert.equal(notSent.currentStageId, "building");
    assert.equal(notSent.waitingOn, "us");
    // once released, it becomes the customer's gate.
    const sent = statusToStageView("preview", true);
    assert.equal(sent.currentStageId, "preview");
    assert.equal(sent.waitingOn, "you");
  });

  it("defaults previewSent to true so a bare preview status is the gate", () => {
    assert.equal(statusToStageView("preview").currentStageId, "preview");
  });

  it("maps published, exported, and upgraded to live", () => {
    for (const s of ["published", "exported", "upgraded"] as TrailheadSiteStatus[]) {
      const v = statusToStageView(s);
      assert.equal(v.currentStageId, "live", `${s} should be live`);
      assert.equal(v.waitingOn, "none");
    }
  });

  it("routes waitlisted, correcting, and declined to special states", () => {
    assert.equal(statusToStageView("waitlisted").special, "waitlisted");
    assert.equal(statusToStageView("correcting").special, "correcting");
    assert.equal(statusToStageView("declined").special, "declined");
    assert.equal(statusToStageView("declined").currentStageId, null);
  });

  it("returns a currentIndex that indexes into TRAILHEAD_STAGES for linear states", () => {
    const v = statusToStageView("awaiting_approval");
    assert.equal(TRAILHEAD_STAGES[v.currentIndex].id, "review");
  });
});

describe("stepState", () => {
  it("marks earlier steps done, the current step current, later steps upcoming", () => {
    assert.equal(stepState(0, 2), "done");
    assert.equal(stepState(2, 2), "current");
    assert.equal(stepState(3, 2), "upcoming");
  });
});

describe("isValidStatusToken", () => {
  it("accepts a v4-style UUID", () => {
    assert.equal(isValidStatusToken("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), true);
  });

  it("rejects non-UUID strings and non-strings", () => {
    assert.equal(isValidStatusToken("not-a-token"), false);
    assert.equal(isValidStatusToken(""), false);
    assert.equal(isValidStatusToken("3f2504e0-4f89-41d3-9a0c"), false);
    assert.equal(isValidStatusToken("../../etc/passwd"), false);
    assert.equal(isValidStatusToken(null), false);
    assert.equal(isValidStatusToken(12345), false);
  });
});

describe("isPlausibleEmail", () => {
  it("accepts ordinary and plus-addressed emails", () => {
    assert.equal(isPlausibleEmail("name@gmail.com"), true);
    assert.equal(isPlausibleEmail("name+test@gmail.com"), true);
    assert.equal(isPlausibleEmail("  name+test@gmail.com  "), true);
    assert.equal(isPlausibleEmail("a.b+c@sub.example.co.uk"), true);
  });

  it("rejects malformed addresses and non-strings", () => {
    assert.equal(isPlausibleEmail("nope"), false);
    assert.equal(isPlausibleEmail("no@domain"), false);
    assert.equal(isPlausibleEmail("@gmail.com"), false);
    assert.equal(isPlausibleEmail("a b@gmail.com"), false);
    assert.equal(isPlausibleEmail(null), false);
  });
});

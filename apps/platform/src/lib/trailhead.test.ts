import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
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

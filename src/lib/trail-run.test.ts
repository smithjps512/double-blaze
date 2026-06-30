/**
 * Unit tests for the Trail Run pure helpers. Run with:
 *   npm test
 * which invokes node's built-in test runner through the tsx loader.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  buildConsentRecord,
  checkinDayFor,
  computeRetentionExpiry,
  computeWindowEnd,
  consentAcknowledgment,
  daysRemaining,
  DEFAULT_TRAIL_TIER,
  isValidTrailTier,
  normalizeTrailTier,
  TRAIL_RUN_RETENTION_DAYS,
  TRAIL_RUN_TERM_MONTHS,
  TRAIL_RUN_WINDOW_DAYS,
} from "./trail-run";

test("isValidTrailTier accepts known tiers and rejects others", () => {
  assert.equal(isValidTrailTier("blue"), true);
  assert.equal(isValidTrailTier("double_black"), true);
  assert.equal(isValidTrailTier("platinum"), false);
  assert.equal(isValidTrailTier(null), false);
  assert.equal(isValidTrailTier(undefined), false);
  assert.equal(isValidTrailTier(""), false);
});

test("normalizeTrailTier falls back to the default tier", () => {
  assert.equal(normalizeTrailTier("black"), "black");
  assert.equal(normalizeTrailTier("nope"), DEFAULT_TRAIL_TIER);
  assert.equal(normalizeTrailTier(null), DEFAULT_TRAIL_TIER);
  assert.equal(DEFAULT_TRAIL_TIER, "blue");
});

test("addDays does not mutate its input", () => {
  const base = new Date("2026-01-01T00:00:00.000Z");
  const out = addDays(base, 10);
  assert.equal(base.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(out.toISOString(), "2026-01-11T00:00:00.000Z");
});

test("computeWindowEnd is launch + 30 days", () => {
  const launch = new Date("2026-03-01T12:00:00.000Z");
  const end = computeWindowEnd(launch);
  assert.equal(end.getTime() - launch.getTime(), TRAIL_RUN_WINDOW_DAYS * 86_400_000);
  assert.equal(end.toISOString(), "2026-03-31T12:00:00.000Z");
});

test("computeRetentionExpiry is cancellation + 90 days", () => {
  const cancel = new Date("2026-04-01T00:00:00.000Z");
  const expiry = computeRetentionExpiry(cancel);
  assert.equal(
    expiry.getTime() - cancel.getTime(),
    TRAIL_RUN_RETENTION_DAYS * 86_400_000,
  );
});

test("consentAcknowledgment names the tier, the term, and contains no em dash", () => {
  const text = consentAcknowledgment("blue");
  assert.match(text, /Blue Trail/);
  assert.match(text, new RegExp(`${TRAIL_RUN_TERM_MONTHS}-month term`));
  assert.ok(!text.includes("—"), "must not contain an em dash");
});

test("daysRemaining counts the current partial day and floors at zero", () => {
  const launch = new Date("2026-03-01T12:00:00.000Z");
  const windowEnd = computeWindowEnd(launch); // launch + 30
  // On launch day, the full window remains.
  assert.equal(daysRemaining(windowEnd, launch), 30);
  // Exactly 14 days before window end.
  assert.equal(daysRemaining(windowEnd, addDays(windowEnd, -14)), 14);
  // A partial day still counts as a day (ceil): 13 days and 1 hour out -> 14.
  assert.equal(
    daysRemaining(windowEnd, new Date(addDays(windowEnd, -14).getTime() + 60 * 60 * 1000)),
    14,
  );
  // At/after window end, zero (never negative).
  assert.equal(daysRemaining(windowEnd, windowEnd), 0);
  assert.equal(daysRemaining(windowEnd, addDays(windowEnd, 5)), 0);
});

test("daysRemaining hits each cadence day exactly once across a daily run", () => {
  const launch = new Date("2026-03-01T13:00:00.000Z");
  const windowEnd = computeWindowEnd(launch);
  const hits: number[] = [];
  // Simulate a daily run at the same hour for the whole window.
  for (let d = 0; d <= 30; d++) {
    const now = addDays(launch, d);
    const day = checkinDayFor(daysRemaining(windowEnd, now));
    if (day) hits.push(day);
  }
  assert.deepEqual(hits, [14, 7, 3, 1]);
});

test("checkinDayFor maps only the cadence days", () => {
  assert.equal(checkinDayFor(14), 14);
  assert.equal(checkinDayFor(7), 7);
  assert.equal(checkinDayFor(3), 3);
  assert.equal(checkinDayFor(1), 1);
  assert.equal(checkinDayFor(30), null);
  assert.equal(checkinDayFor(13), null);
  assert.equal(checkinDayFor(0), null);
});

test("buildConsentRecord captures tier, timestamp, ip, and term", () => {
  const at = new Date("2026-06-30T15:00:00.000Z");
  const record = buildConsentRecord({ tier: "black", consentedAt: at, ip: "203.0.113.7" });
  assert.equal(record.program, "trail_run");
  assert.equal(record.selected_tier, "black");
  assert.equal(record.term_months, TRAIL_RUN_TERM_MONTHS);
  assert.equal(record.consented_at, "2026-06-30T15:00:00.000Z");
  assert.equal(record.ip, "203.0.113.7");
  assert.match(record.acknowledgment, /Black Trail/);
});

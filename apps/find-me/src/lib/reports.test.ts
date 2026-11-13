import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceMeters, fuzz, PUBLIC_RADIUS_METERS } from "./geo";
import { compareReports, detailOverlap, parseReportForm, suggestMatches, type Report } from "./reports";

const home = { lat: 37.2296, lng: -80.4139 };

test("fuzz hides the exact spot but stays inside the public circle", () => {
  for (let i = 0; i < 500; i++) {
    const p = { lat: home.lat + (Math.random() - 0.5) * 0.05, lng: home.lng + (Math.random() - 0.5) * 0.05 };
    const f = fuzz(p);
    const d = distanceMeters(p, f);
    assert.ok(d <= PUBLIC_RADIUS_METERS, `exact point ${d.toFixed(0)} m from public point`);
  }
});

test("fuzz is stable: neighbors in one cell share a public point, so reloading cannot average it away", () => {
  const a = fuzz(home);
  assert.deepEqual(fuzz(home), a);
  assert.deepEqual(fuzz({ lat: home.lat + 0.00001, lng: home.lng + 0.00001 }), fuzz({ lat: home.lat + 0.00002, lng: home.lng }));
  assert.notDeepEqual(a, home);
});

const base: Report = {
  id: "l1",
  kind: "lost",
  userId: "u1",
  species: "dog",
  name: "Biscuit",
  sex: "male",
  size: "medium",
  colors: "tan with white chest",
  description: "",
  photoUrl: null,
  seenOn: "2026-11-01",
  areaText: "near the park",
  publicPoint: fuzz(home),
  microchipped: "yes",
  status: "open",
  createdAt: "2026-11-01T12:00:00Z",
};
const found = (o: Partial<Report>): Report => ({ ...base, id: "f" + Math.random(), kind: "found", userId: "u2", name: "", ...o });

test("a nearby found dog with the same colors, a day later, is a strong match", () => {
  const m = compareReports(base, found({ seenOn: "2026-11-02", colors: "Tan, white chest", publicPoint: fuzz({ lat: home.lat + 0.004, lng: home.lng }) }));
  assert.ok(m && m.score >= 80, `score ${m?.score}`);
  assert.ok(m!.reasons.some((r) => r.includes("tan")));
});

test("impossible matches are ruled out, not scored low", () => {
  assert.equal(compareReports(base, found({ species: "cat" })), null);
  assert.equal(compareReports(base, found({ seenOn: "2026-10-20" })), null);
  assert.equal(compareReports(base, found({ seenOn: "2027-02-01" })), null);
  assert.equal(compareReports(base, found({ publicPoint: { lat: home.lat + 0.2, lng: home.lng } })), null);
  assert.equal(compareReports(base, found({ sex: "female" })), null);
  assert.equal(compareReports(base, found({ status: "reunited" })), null);
  assert.ok(compareReports(base, found({ sex: "unknown" })));
});

test("suggestMatches works from either side and sorts best first", () => {
  const close = found({ id: "close", colors: "tan white" });
  const far = found({ id: "far", colors: "black", publicPoint: fuzz({ lat: home.lat + 0.05, lng: home.lng }) });
  const fromLost = suggestMatches(base, [far, close, base], 5, 0);
  assert.deepEqual(fromLost.map((m) => m.report.id), ["close", "far"]);
  const fromFound = suggestMatches(close, [base], 5, 0);
  assert.equal(fromFound[0].report.id, "l1");
});

test("detailOverlap rewards specifics and flags vague guesses", () => {
  const secret = "Blue collar with a star tag, notch in left ear";
  assert.equal(detailOverlap(secret, "brown dog, very friendly").strength, "none");
  assert.equal(detailOverlap(secret, "star tag on a blue collar").strength, "strong");
  assert.equal(detailOverlap(secret, "his left ear").strength, "strong");
  assert.equal(detailOverlap(secret, "there is a notch somewhere").strength, "some");
});

function form(o: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}
const good = {
  kind: "lost", species: "dog", name: "Biscuit", size: "medium", colors: "tan", seenOn: "2026-11-01",
  areaText: "near the park", lat: String(home.lat), lng: String(home.lng), secretDetail: "notch in left ear",
};

test("parseReportForm accepts a complete post", () => {
  const { value, errors } = parseReportForm(form(good), "2026-11-13");
  assert.deepEqual(errors, {});
  assert.equal(value?.sex, "unknown");
  assert.equal(value?.microchipped, "unknown");
});

test("parseReportForm requires a map spot, a secret detail, and no future dates", () => {
  const { errors } = parseReportForm(form({ ...good, lat: "", lng: "", secretDetail: "", seenOn: "2026-12-01" }), "2026-11-13");
  assert.ok(errors.location && errors.secretDetail && errors.seenOn);
});

test("found posts do not need a name; lost posts do", () => {
  assert.ok(parseReportForm(form({ ...good, name: "" }), "2026-11-13").errors.name);
  assert.deepEqual(parseReportForm(form({ ...good, kind: "found", name: "" }), "2026-11-13").errors, {});
});

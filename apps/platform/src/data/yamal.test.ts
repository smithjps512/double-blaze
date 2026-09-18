import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AWARDS,
  BIO,
  HONOURS,
  RECORDS,
  SEASONS,
  SPAIN_CAMPAIGNS,
  SOURCES,
  TEAMS,
  YOUTH_NATIONAL,
  clubTotals,
  perGame,
  sumLines,
} from "./yamal";

/**
 * The data is hand-entered from reporting, so the checks are the ones a
 * careful reader would do by hand: the lines add up to the totals, the
 * remainder rows are the ones marked derived, and the copy follows the house
 * rule on em dashes.
 */

test("every season's competition lines add up to its total", () => {
  for (const season of SEASONS) {
    assert.deepEqual(sumLines(season.lines), season.total, `${season.label} lines do not sum to total`);
  }
});

test("a season has at most one derived row, and it is never the only row", () => {
  for (const season of SEASONS) {
    const derived = season.lines.filter((l) => l.derived);
    assert.ok(derived.length <= 1, `${season.label} has ${derived.length} derived rows`);
    if (derived.length === 1) {
      assert.ok(season.lines.length > 1, `${season.label} is only a derived row`);
    }
  }
});

test("club totals are the sum of the seasons", () => {
  const t = clubTotals();
  assert.equal(
    t.apps,
    SEASONS.reduce((n, s) => n + s.total.apps, 0),
  );
  assert.equal(
    t.goals,
    SEASONS.reduce((n, s) => n + s.total.goals, 0),
  );
  assert.equal(
    t.assists,
    SEASONS.reduce((n, s) => n + s.total.assists, 0),
  );
});

test("only the last season can be in progress", () => {
  SEASONS.forEach((season, i) => {
    if (season.inProgress) assert.equal(i, SEASONS.length - 1, `${season.label} is mid-list but in progress`);
  });
});

test("the youth national record on the team card matches the age-group table", () => {
  const youth = TEAMS.find((t) => t.slug === "spain-youth");
  assert.ok(youth?.record);
  assert.equal(youth.record.apps, YOUTH_NATIONAL.reduce((n, r) => n + r.apps, 0));
  assert.equal(youth.record.goals, YOUTH_NATIONAL.reduce((n, r) => n + r.goals, 0));
});

test("team slugs are unique and URL-safe", () => {
  const slugs = TEAMS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9-]+$/);
});

test("per-game rate never divides by zero", () => {
  assert.equal(perGame(5, 0), "0.00");
  assert.equal(perGame(3, 2), "1.50");
});

test("no em dashes anywhere in the copy", () => {
  const seen: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (value.includes("—")) seen.push(path);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
    }
  };
  walk({ BIO, SEASONS, SPAIN_CAMPAIGNS, TEAMS, YOUTH_NATIONAL, AWARDS, HONOURS, RECORDS, SOURCES }, "data");
  assert.deepEqual(seen, []);
});

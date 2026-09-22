import "server-only";
import {
  BREAK_IT_TESTS,
  rankBugs,
  summariseTesting,
  type Bug,
  type BuildCard,
  type CardResult,
  type RankedBug,
  type Severity,
  type TeacherPriority,
  type TeamTesting,
  type TestOutcome,
} from "@double-blaze/prototype-forge";
import { getSupabaseServiceClient } from "./supabase";
import { teamCards } from "./trail-crew-progress";
import buildContext from "@/data/build-context.json";

/**
 * A team's user test sheets, live.
 *
 * The Word sheet a tester fills in has five parts: the cards they tested, the
 * six ways they tried to break it, the bugs they found, their ratings, and
 * their own words. This is that sheet with a database behind it, so what a
 * tester found lands on the card it was about and on the class priority
 * board the same minute, and a bug leaves the board only when somebody runs
 * its steps again and it passes.
 *
 * The rules that decide what a card reads as and what order the bugs go in
 * are in the engine (`test-results.ts`), not here. This module reads rows,
 * checks writes against the team's committed cards, and hands the rest to
 * the engine, which is the same split the project board uses.
 *
 * No student identity, ever. A sheet is "Tester 2", the second one this team
 * has had, and a tester's own name is nowhere in these tables.
 */

const context = buildContext as { teams: Record<string, { productName: string; teamName?: string; cards?: string }> };

export interface TestSheet {
  id: string;
  tester: string;
  device: string | null;
  testedOn: string;
  keep: string[];
  change: string[];
  missingStory: string | null;
  ratings: number[] | null;
}

export interface TeamTestingView {
  slug: string;
  productName: string;
  teamName?: string;
  cards: BuildCard[];
  summary: TeamTesting;
  sheets: TestSheet[];
}

interface SheetRow {
  id: string;
  team_slug: string;
  tester: string;
  device: string | null;
  tested_on: string;
  keep: string[] | null;
  change: string[] | null;
  missing_story: string | null;
  ratings: number[] | null;
}

interface BugRow {
  id: string;
  team_slug: string;
  card_slug: string | null;
  title: string;
  steps: string | null;
  severity: number | null;
  teacher_priority: string | null;
  created_at: string;
}

interface ResultRow {
  id: string;
  team_slug: string;
  sheet_id: string | null;
  card_slug: string | null;
  bug_id: string | null;
  outcome: string;
  what_i_did: string | null;
  what_happened: string | null;
  created_at: string;
}

const SHEET_COLUMNS = "id, team_slug, tester, device, tested_on, keep, change, missing_story, ratings";
const BUG_COLUMNS = "id, team_slug, card_slug, title, steps, severity, teacher_priority, created_at";
const RESULT_COLUMNS = "id, team_slug, sheet_id, card_slug, bug_id, outcome, what_i_did, what_happened, created_at";

/** How much a tester may type in one box. Enough for a bug report, not an essay. */
export const MAX_TEXT = 1200;
const MAX_TITLE = 240;

function toBug(r: BugRow): Bug {
  const severity = r.severity === 1 || r.severity === 2 || r.severity === 3 ? (r.severity as Severity) : null;
  const priority =
    r.teacher_priority === "now" || r.teacher_priority === "next" || r.teacher_priority === "later"
      ? (r.teacher_priority as TeacherPriority)
      : null;
  return { id: r.id, cardSlug: r.card_slug, title: r.title, steps: r.steps, severity, teacherPriority: priority, reportedAt: r.created_at };
}

function toResult(r: ResultRow): CardResult {
  return {
    id: r.id,
    cardSlug: r.card_slug ?? "",
    bugId: r.bug_id,
    outcome: r.outcome === "pass" ? "pass" : "fail",
    whatIDid: r.what_i_did,
    whatHappened: r.what_happened,
    testedAt: r.created_at,
  };
}

function toSheet(r: SheetRow): TestSheet {
  return {
    id: r.id,
    tester: r.tester,
    device: r.device,
    testedOn: r.tested_on,
    keep: r.keep ?? [],
    change: r.change ?? [],
    missingStory: r.missing_story,
    ratings: r.ratings,
  };
}

function clean(value: unknown, max = MAX_TEXT): string | null {
  if (typeof value !== "string") return null;
  const t = value.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

function cleanList(value: unknown, max = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => clean(v, 400)).filter((v): v is string => !!v).slice(0, max);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function readRows(slugs?: string[]): Promise<{ sheets: SheetRow[]; bugs: BugRow[]; results: ResultRow[] }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return { sheets: [], bugs: [], results: [] };
  const read = async (table: string, columns: string) => {
    let q = supabase.from(table).select(columns).order("created_at", { ascending: true });
    if (slugs) q = q.in("team_slug", slugs);
    const { data, error } = await q;
    if (error) console.error(`[trail-crew] could not read ${table}: ${error.message}`);
    return (data ?? []) as unknown[];
  };
  const [sheets, bugs, results] = await Promise.all([
    read("trail_crew_test_sheets", SHEET_COLUMNS),
    read("trail_crew_bugs", BUG_COLUMNS),
    read("trail_crew_test_results", RESULT_COLUMNS),
  ]);
  return { sheets: sheets as SheetRow[], bugs: bugs as BugRow[], results: results as ResultRow[] };
}

function view(slug: string, rows: { sheets: SheetRow[]; bugs: BugRow[]; results: ResultRow[] }): TeamTestingView | null {
  const found = teamCards(slug);
  if (!found) return null;
  const mine = <T extends { team_slug: string }>(list: T[]) => list.filter((r) => r.team_slug === slug);
  return {
    slug,
    productName: found.team.productName,
    teamName: found.team.teamName,
    cards: found.cards,
    summary: summariseTesting(found.cards, mine(rows.results).map(toResult), mine(rows.bugs).map(toBug)),
    sheets: mine(rows.sheets).map(toSheet),
  };
}

export async function getTeamTesting(slug: string): Promise<TeamTestingView | null> {
  if (!teamCards(slug)) return null;
  return view(slug, await readRows([slug]));
}

/** Every team's testing at once, for the gallery and the queue page. */
export async function getAllTesting(): Promise<Record<string, TeamTestingView>> {
  const rows = await readRows();
  const out: Record<string, TeamTestingView> = {};
  for (const slug of Object.keys(context.teams ?? {})) {
    const v = view(slug, rows);
    if (v && v.summary.tested) out[slug] = v;
  }
  return out;
}

export interface PriorityRow extends RankedBug {
  teamSlug: string;
  productName: string;
}

/**
 * The priority board: every open bug in the class, in the engine's order.
 *
 * `prefix` narrows it to one period's teams by their folder prefix
 * ("period-1-"), which is how the folders are already named.
 */
export async function getPriorityBoard(prefix?: string): Promise<PriorityRow[]> {
  const rows = await readRows();
  const inputs: Array<{ slug: string; productName: string; input: Parameters<typeof rankBugs>[0][number] }> = [];
  for (const slug of Object.keys(context.teams ?? {})) {
    if (prefix && !slug.startsWith(prefix)) continue;
    const v = view(slug, rows);
    if (!v || v.summary.openBugs === 0) continue;
    inputs.push({
      slug,
      productName: v.productName,
      input: {
        team: v.productName,
        cards: v.cards,
        results: rows.results.filter((r) => r.team_slug === slug).map(toResult),
        bugs: rows.bugs.filter((r) => r.team_slug === slug).map(toBug),
      },
    });
  }
  const ranked = rankBugs(inputs.map((i) => i.input));
  const bySlugOfBug = new Map<string, { slug: string; productName: string }>();
  for (const i of inputs) for (const b of i.input.bugs) bySlugOfBug.set(b.id, { slug: i.slug, productName: i.productName });
  return ranked.map((r) => {
    const owner = bySlugOfBug.get(r.bug.id)!;
    return { ...r, teamSlug: owner.slug, productName: owner.productName };
  });
}

// ---------------------------------------------------------------------------
// Writes, every one checked against the committed cards first
// ---------------------------------------------------------------------------

type Outcome = { ok: true; id?: string; tester?: string } | { ok: false; error: string };

const NO_DB: Outcome = { ok: false, error: "Testing is not switched on yet. Ask your teacher." };

/** A new sheet for a team. Numbered, never named. */
export async function startSheet(slug: string, input: { device?: unknown }): Promise<Outcome> {
  if (!teamCards(slug)) return { ok: false, error: "No such team." };
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NO_DB;
  const { count } = await supabase
    .from("trail_crew_test_sheets")
    .select("id", { count: "exact", head: true })
    .eq("team_slug", slug);
  const tester = `Tester ${(count ?? 0) + 1}`;
  const { data, error } = await supabase
    .from("trail_crew_test_sheets")
    .insert({ team_slug: slug, tester, device: clean(input.device, 40) })
    .select("id")
    .single();
  if (error || !data) {
    console.error(`[trail-crew] could not start a sheet: ${error?.message}`);
    return { ok: false, error: "Could not start a sheet. Try again." };
  }
  return { ok: true, id: (data as { id: string }).id, tester };
}

async function sheetBelongs(slug: string, sheetId: unknown): Promise<string | null> {
  if (typeof sheetId !== "string" || !sheetId) return null;
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const { data } = await supabase.from("trail_crew_test_sheets").select("id").eq("id", sheetId).eq("team_slug", slug).maybeSingle();
  return data ? (data as { id: string }).id : null;
}

/** Part 4 and Part 5: ratings and the tester's own words, onto their sheet. */
export async function finishSheet(
  slug: string,
  input: { sheetId: unknown; keep?: unknown; change?: unknown; missingStory?: unknown; ratings?: unknown },
): Promise<Outcome> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NO_DB;
  const sheetId = await sheetBelongs(slug, input.sheetId);
  if (!sheetId) return { ok: false, error: "That sheet is not this team's." };
  const ratings = Array.isArray(input.ratings)
    ? input.ratings.map((n) => (typeof n === "number" && n >= 1 && n <= 5 ? Math.round(n) : null))
    : null;
  const { error } = await supabase
    .from("trail_crew_test_sheets")
    .update({
      keep: cleanList(input.keep),
      change: cleanList(input.change),
      missing_story: clean(input.missingStory, 400),
      ratings: ratings && ratings.every((n) => n !== null) && ratings.length === 5 ? ratings : null,
    })
    .eq("id", sheetId);
  if (error) {
    console.error(`[trail-crew] could not finish a sheet: ${error.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  return { ok: true, id: sheetId };
}

/**
 * A card tested, or a bug re-tested.
 *
 * With a bug id this is a re-test: the tester did the bug's steps again and
 * it passed (it did not happen) or failed (it still happens). A pass is the
 * one thing that closes a bug. Without a bug id it is a card-level result.
 */
export async function recordResult(
  slug: string,
  input: { sheetId?: unknown; cardSlug?: unknown; bugId?: unknown; outcome: unknown; whatIDid?: unknown; whatHappened?: unknown },
): Promise<Outcome> {
  const found = teamCards(slug);
  if (!found) return { ok: false, error: "No such team." };
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NO_DB;
  const outcome: TestOutcome | null = input.outcome === "pass" ? "pass" : input.outcome === "fail" ? "fail" : null;
  if (!outcome) return { ok: false, error: "Say pass or fail." };

  let cardSlug: string | null = null;
  let bugId: string | null = null;
  if (typeof input.bugId === "string" && input.bugId) {
    const { data } = await supabase.from("trail_crew_bugs").select("id, card_slug").eq("id", input.bugId).eq("team_slug", slug).maybeSingle();
    if (!data) return { ok: false, error: "That bug is not on this team's board." };
    bugId = (data as { id: string }).id;
    cardSlug = (data as { card_slug: string | null }).card_slug;
  } else {
    const card = found.cards.find((c) => c.slug === input.cardSlug);
    if (!card) return { ok: false, error: "That card is not on this team's page." };
    cardSlug = card.slug;
  }

  const sheetId = input.sheetId ? await sheetBelongs(slug, input.sheetId) : null;
  const { data, error } = await supabase
    .from("trail_crew_test_results")
    .insert({
      team_slug: slug,
      sheet_id: sheetId,
      card_slug: cardSlug,
      bug_id: bugId,
      outcome,
      what_i_did: clean(input.whatIDid),
      what_happened: clean(input.whatHappened),
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error(`[trail-crew] could not record a result: ${error?.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  return { ok: true, id: (data as { id: string }).id };
}

/** One row of "Bugs you found". A card is optional; a title is not. */
export async function reportBug(
  slug: string,
  input: { sheetId?: unknown; cardSlug?: unknown; title: unknown; steps?: unknown; severity?: unknown },
): Promise<Outcome> {
  const found = teamCards(slug);
  if (!found) return { ok: false, error: "No such team." };
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NO_DB;
  const title = clean(input.title, MAX_TITLE);
  if (!title) return { ok: false, error: "Say what went wrong, in one sentence." };
  let cardSlug: string | null = null;
  if (typeof input.cardSlug === "string" && input.cardSlug) {
    const card = found.cards.find((c) => c.slug === input.cardSlug);
    if (!card) return { ok: false, error: "That card is not on this team's page." };
    cardSlug = card.slug;
  }
  const severity = input.severity === 1 || input.severity === 2 || input.severity === 3 ? input.severity : null;
  const sheetId = input.sheetId ? await sheetBelongs(slug, input.sheetId) : null;
  const { data, error } = await supabase
    .from("trail_crew_bugs")
    .insert({ team_slug: slug, sheet_id: sheetId, card_slug: cardSlug, title, steps: clean(input.steps), severity })
    .select("id")
    .single();
  if (error || !data) {
    console.error(`[trail-crew] could not report a bug: ${error?.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  return { ok: true, id: (data as { id: string }).id };
}

/**
 * Part 2, "try to break it". A test the app handled is nothing to store; one
 * it did not handle is a bug, with the sheet's own words as its title so it
 * reads the same on the board as on paper.
 */
export async function recordBreakTest(
  slug: string,
  input: { sheetId?: unknown; index: unknown; handled: unknown; whatHappened?: unknown },
): Promise<Outcome> {
  const index = typeof input.index === "number" ? input.index : -1;
  const test = BREAK_IT_TESTS[index];
  if (!test) return { ok: false, error: "That is not one of the six." };
  if (input.handled === true) return { ok: true };
  return reportBug(slug, {
    sheetId: input.sheetId,
    title: `Broke it: ${test}`,
    steps: input.whatHappened,
    severity: null,
  });
}

/** A teacher moves a bug by hand, or lets the rule decide again with null. */
export async function setBugPriority(slug: string, bugId: unknown, priority: unknown): Promise<Outcome> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NO_DB;
  if (typeof bugId !== "string" || !bugId) return { ok: false, error: "No such bug." };
  const value = priority === "now" || priority === "next" || priority === "later" ? priority : null;
  const { data, error } = await supabase
    .from("trail_crew_bugs")
    .update({ teacher_priority: value })
    .eq("id", bugId)
    .eq("team_slug", slug)
    .select("id");
  if (error) {
    console.error(`[trail-crew] could not set a priority: ${error.message}`);
    return { ok: false, error: "Could not save that." };
  }
  if (!data || data.length === 0) return { ok: false, error: "No such bug." };
  return { ok: true, id: bugId };
}

/** A teacher's reset: every sheet, result and bug this team has, gone. */
export async function clearTesting(slug: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const results = await supabase.from("trail_crew_test_results").delete().eq("team_slug", slug);
  const bugs = await supabase.from("trail_crew_bugs").delete().eq("team_slug", slug);
  const sheets = await supabase.from("trail_crew_test_sheets").delete().eq("team_slug", slug);
  for (const r of [results, bugs, sheets]) {
    if (r.error) console.error(`[trail-crew] could not clear testing: ${r.error.message}`);
  }
  return !results.error && !bugs.error && !sheets.error;
}

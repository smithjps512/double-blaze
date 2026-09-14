import "server-only";
import { parseCards, type BuildCard } from "@double-blaze/prototype-forge";
import { getSupabaseServiceClient } from "./supabase";
import buildContext from "@/data/build-context.json";

/**
 * A team's live progress on their build cards.
 *
 * The cards themselves are documents in git, and a card's finish line is the
 * list of criteria on it. Progress is which of those are done, and it is the
 * one thing in Trail Crew that is not a document: it changes every few minutes
 * in class, needs nobody's approval, and has to survive a Chromebook being
 * handed to the next person. So it lives in Supabase, keyed by team and card,
 * and everything that shows it reads it fresh.
 *
 * Every write is checked against the committed cards first. A team can only
 * tick a criterion that is actually on one of their cards, which keeps the
 * table honest without anybody signing in.
 */

export type CardState = "not_started" | "building" | "done";

export interface CardProgress {
  card: BuildCard;
  state: CardState;
  /** True for each criterion, by index, that has been ticked. */
  done: boolean[];
}

export interface TeamProgress {
  slug: string;
  productName: string;
  teamName?: string;
  cards: CardProgress[];
  /** Cards marked done, and cards total. */
  doneCards: number;
  totalCards: number;
  /** Criteria ticked, and criteria total. */
  doneCriteria: number;
  totalCriteria: number;
}

interface TeamContext {
  productName: string;
  teamName?: string;
  cards?: string;
}

const context = buildContext as { teams: Record<string, TeamContext> };

export function teamCards(slug: string): { team: TeamContext; cards: BuildCard[] } | null {
  const team = context.teams?.[slug];
  if (!team) return null;
  return { team, cards: team.cards ? parseCards(team.cards) : [] };
}

interface Row {
  card_slug: string;
  criterion: string | null;
  state: string;
}

function summarise(slug: string, team: TeamContext, cards: BuildCard[], rows: Row[]): TeamProgress {
  const progress: CardProgress[] = cards.map((card) => {
    const mine = rows.filter((r) => r.card_slug === card.slug);
    const stateRow = mine.find((r) => r.criterion === null);
    const done = card.criteria.map((c) =>
      mine.some((r) => r.criterion !== null && r.criterion.trim() === c.trim() && r.state === "done"),
    );
    // A card whose every criterion is ticked is done whether or not anybody
    // said so, and a card with a tick on it has been started.
    const inferred: CardState =
      card.criteria.length > 0 && done.every(Boolean)
        ? "done"
        : done.some(Boolean)
          ? "building"
          : "not_started";
    const state =
      stateRow && (stateRow.state === "done" || stateRow.state === "building" || stateRow.state === "not_started")
        ? (stateRow.state as CardState)
        : inferred;
    return { card, state: state === "not_started" && inferred !== "not_started" ? inferred : state, done };
  });

  return {
    slug,
    productName: team.productName,
    teamName: team.teamName,
    cards: progress,
    doneCards: progress.filter((p) => p.state === "done").length,
    totalCards: progress.length,
    doneCriteria: progress.reduce((n, p) => n + p.done.filter(Boolean).length, 0),
    totalCriteria: progress.reduce((n, p) => n + p.card.criteria.length, 0),
  };
}

export async function getTeamProgress(slug: string): Promise<TeamProgress | null> {
  const found = teamCards(slug);
  if (!found) return null;
  const supabase = getSupabaseServiceClient();
  let rows: Row[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("trail_crew_progress")
      .select("card_slug, criterion, state")
      .eq("team_slug", slug);
    if (error) console.error(`[trail-crew] could not read progress: ${error.message}`);
    rows = (data ?? []) as Row[];
  }
  return summarise(slug, found.team, found.cards, rows);
}

/**
 * Everyone's progress in one query, for the gallery board.
 *
 * Returns a map so the gallery can stay a static list with one number added
 * to each row, and an empty map when there is no database, so the page renders
 * the same with nothing configured.
 */
export async function getAllProgress(): Promise<Record<string, TeamProgress>> {
  const supabase = getSupabaseServiceClient();
  const rowsBySlug = new Map<string, Row[]>();
  if (supabase) {
    const { data, error } = await supabase
      .from("trail_crew_progress")
      .select("team_slug, card_slug, criterion, state");
    if (error) console.error(`[trail-crew] could not read progress: ${error.message}`);
    for (const r of (data ?? []) as Array<Row & { team_slug: string }>) {
      const list = rowsBySlug.get(r.team_slug) ?? [];
      list.push(r);
      rowsBySlug.set(r.team_slug, list);
    }
  }
  const out: Record<string, TeamProgress> = {};
  for (const [slug, team] of Object.entries(context.teams ?? {})) {
    if (!team.cards) continue;
    out[slug] = summarise(slug, team, parseCards(team.cards), rowsBySlug.get(slug) ?? []);
  }
  return out;
}

export type ProgressWrite =
  | { kind: "criterion"; cardSlug: string; criterion: string; done: boolean }
  | { kind: "card"; cardSlug: string; state: CardState };

/**
 * Record a tick or a card status.
 *
 * Refuses anything that does not name a real card and, for a tick, a real
 * criterion on it, so the table can only ever hold what the cards page shows.
 */
export async function writeProgress(
  slug: string,
  write: ProgressWrite,
): Promise<{ ok: boolean; error?: string }> {
  const found = teamCards(slug);
  if (!found) return { ok: false, error: "No such team." };
  const card = found.cards.find((c) => c.slug === write.cardSlug);
  if (!card) return { ok: false, error: "That card is not on this team's page." };

  const supabase = getSupabaseServiceClient();
  if (!supabase) return { ok: false, error: "Progress is not switched on yet. Ask your teacher." };

  let row: { team_slug: string; card_slug: string; criterion: string | null; state: string };
  if (write.kind === "criterion") {
    const criterion = card.criteria.find((c) => c.trim() === write.criterion.trim());
    if (!criterion) return { ok: false, error: "That line is not on the card." };
    row = { team_slug: slug, card_slug: card.slug, criterion, state: write.done ? "done" : "open" };
  } else {
    row = { team_slug: slug, card_slug: card.slug, criterion: null, state: write.state };
  }

  // The unique index is on an expression, which upsert cannot target by name,
  // so it is a delete and an insert. Two teammates ticking the same box in the
  // same second end up with the same row either way.
  const del = supabase.from("trail_crew_progress").delete().eq("team_slug", slug).eq("card_slug", card.slug);
  const { error: delError } = await (row.criterion === null
    ? del.is("criterion", null)
    : del.eq("criterion", row.criterion));
  if (delError) {
    console.error(`[trail-crew] could not clear progress row: ${delError.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  const { error } = await supabase.from("trail_crew_progress").insert(row);
  if (error) {
    console.error(`[trail-crew] could not write progress: ${error.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  return { ok: true };
}

/** A teacher's reset: everything this team ticked, gone. */
export async function clearProgress(slug: string): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const { error } = await supabase.from("trail_crew_progress").delete().eq("team_slug", slug);
  if (error) console.error(`[trail-crew] could not clear progress: ${error.message}`);
  return !error;
}

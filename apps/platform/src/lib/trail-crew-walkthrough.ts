import "server-only";
import {
  buildWalkthrough,
  parseArchitecture,
  parseCards,
  walkthroughStep,
  walkthroughSteps,
  walkthroughStepText,
  WALKTHROUGH_CARD_SLUG,
  WALKTHROUGH_TRACKS,
  type Walkthrough,
  type WalkthroughTrack,
} from "@double-blaze/prototype-forge";
import { getSupabaseServiceClient } from "./supabase";
import buildContext from "@/data/build-context.json";

/**
 * A team's place in the design walkthrough.
 *
 * The walkthrough itself is generated from the team's committed architecture
 * and cards, the same way the design brief is, so this module rebuilds it from
 * the build context rather than trusting anything a page sends. A step id is
 * valid when the rebuilt walkthrough has it; a track is valid when it is one of
 * the two.
 *
 * Progress lives in `trail_crew_progress` beside the build card ticks, under a
 * card slug no real card can have. The card summaries filter by their own
 * slugs, so these rows never show up as a card. A teacher's reset clears them
 * with everything else, which is right: it is one team's progress.
 *
 * Team level, anonymous, like the rest of Trail Crew.
 */

interface TeamContext {
  productName: string;
  cards?: string;
  architecture?: string;
}

const context = buildContext as { teams: Record<string, TeamContext> };

const TRACK_PREFIX = "track:";

export function getWalkthrough(slug: string): Walkthrough | null {
  const team = context.teams?.[slug];
  if (!team?.architecture) return null;
  return buildWalkthrough({
    spec: parseArchitecture(team.architecture),
    cards: team.cards ? parseCards(team.cards) : [],
    productName: team.productName,
  });
}

/** The step, as text for the helper, or nothing when the id is not this team's. */
export function walkthroughStepFor(slug: string, stepId: string): string | undefined {
  const w = getWalkthrough(slug);
  return w ? walkthroughStepText(w, stepId) : undefined;
}

export interface WalkthroughProgress {
  track: WalkthroughTrack | null;
  /** Step ids marked done, in the walkthrough's order. */
  done: string[];
  /** Steps on the chosen track, and how many are done, for a board line. */
  total: number;
  /** The first open step's title on the chosen track, when there is one. */
  next?: string;
}

interface Row {
  criterion: string | null;
  state: string;
}

function summarise(w: Walkthrough, rows: Row[]): WalkthroughProgress {
  const trackRow = rows.find((r) => r.criterion?.startsWith(TRACK_PREFIX) && r.state === "done");
  const trackValue = trackRow?.criterion?.slice(TRACK_PREFIX.length);
  const track = WALKTHROUGH_TRACKS.find((t) => t === trackValue) ?? null;
  const doneSet = new Set(rows.filter((r) => r.state === "done" && r.criterion && !r.criterion.startsWith(TRACK_PREFIX)).map((r) => r.criterion as string));
  const steps = track ? walkthroughSteps(w, track) : w.steps;
  const done = steps.map((s) => s.id).filter((id) => doneSet.has(id));
  const next = track ? steps.find((s) => s.id !== "start" && !doneSet.has(s.id))?.title : undefined;
  return { track, done, total: track ? steps.length - 1 : 0, next };
}

export async function getWalkthroughProgress(slug: string): Promise<WalkthroughProgress | null> {
  const w = getWalkthrough(slug);
  if (!w) return null;
  const supabase = getSupabaseServiceClient();
  let rows: Row[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("trail_crew_progress")
      .select("criterion, state")
      .eq("team_slug", slug)
      .eq("card_slug", WALKTHROUGH_CARD_SLUG);
    if (error) console.error(`[trail-crew] could not read walkthrough progress: ${error.message}`);
    rows = (data ?? []) as Row[];
  }
  return summarise(w, rows);
}

export type WalkthroughWrite = { kind: "step"; stepId: string; done: boolean } | { kind: "track"; track: string };

/**
 * Record a step or a track choice.
 *
 * Refuses a step the team's walkthrough does not have and a track that is not
 * one of the two, so the rows can only ever describe the page the team sees.
 */
export async function writeWalkthroughProgress(slug: string, write: WalkthroughWrite): Promise<{ ok: boolean; error?: string }> {
  const w = getWalkthrough(slug);
  if (!w) return { ok: false, error: "This team has no design brief yet, so there is no walkthrough to save." };

  let criterion: string;
  let state: "done" | "open";
  if (write.kind === "step") {
    if (!walkthroughStep(w, write.stepId)) return { ok: false, error: "That is not a step on this team's page." };
    criterion = write.stepId;
    state = write.done ? "done" : "open";
  } else {
    if (!WALKTHROUGH_TRACKS.includes(write.track as WalkthroughTrack)) return { ok: false, error: "That is not a track." };
    criterion = `${TRACK_PREFIX}${write.track}`;
    state = "done";
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return { ok: false, error: "Progress is not switched on yet. It is saved on this device only." };

  // Same shape as the card ticks: the unique index is an expression, so it is
  // a delete and an insert. A track choice clears the other track's row too,
  // so a team has one track at a time.
  const del = supabase.from("trail_crew_progress").delete().eq("team_slug", slug).eq("card_slug", WALKTHROUGH_CARD_SLUG);
  const { error: delError } = await (write.kind === "track" ? del.like("criterion", `${TRACK_PREFIX}%`) : del.eq("criterion", criterion));
  if (delError) {
    console.error(`[trail-crew] could not clear walkthrough row: ${delError.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  const { error } = await supabase
    .from("trail_crew_progress")
    .insert({ team_slug: slug, card_slug: WALKTHROUGH_CARD_SLUG, criterion, state });
  if (error) {
    console.error(`[trail-crew] could not write walkthrough progress: ${error.message}`);
    return { ok: false, error: "Could not save that. Try again." };
  }
  return { ok: true };
}

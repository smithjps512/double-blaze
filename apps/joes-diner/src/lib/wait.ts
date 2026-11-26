import { holdingVisits, openSeats, waitlist } from "./floor-view";
import type { FloorState, Seat, SeatingChoice, Settings, Visit } from "./types";

/**
 * Wait estimates. For every seat, work out when it should next be free:
 * now if it is open, otherwise when the party holding it is expected to be
 * done (seated time + typical turn, or guests-left time + reset). Then walk
 * the line ahead of the party being quoted, giving each one the earliest
 * opening that fits, the same way staff will. The quote is when the next
 * fitting opening is left for this party.
 *
 * Quotes are honest ranges rounded to 5 minutes. Bar adjacency is ignored
 * here (any free bar seats count), which keeps the estimate simple and
 * slightly optimistic only when the bar is badly split.
 */

const MIN = 60_000;

export interface Turns {
  /** Typical minutes from seated to table ready, by party size. */
  forSize(size: number): number;
  reset: number;
}

export function defaultTurns(settings: Settings): Turns {
  return {
    forSize: (n) =>
      n <= 2 ? settings.turnMinutes.small : n <= 4 ? settings.turnMinutes.medium : settings.turnMinutes.large,
    reset: settings.resetMinutes,
  };
}

/** Median table turns learned from finished visits, once there are enough. */
export function learnedTurns(settings: Settings, history: Pick<Visit, "size" | "seatedAt" | "tableReadyAt">[], minSamples = 30): Turns {
  const base = defaultTurns(settings);
  const buckets = new Map<string, number[]>();
  for (const v of history) {
    if (v.seatedAt === null || v.tableReadyAt === null) continue;
    const minutes = (v.tableReadyAt - v.seatedAt) / MIN;
    if (minutes <= 0 || minutes > 240) continue;
    const key = bucket(v.size);
    buckets.set(key, [...(buckets.get(key) ?? []), minutes]);
  }
  const learned = new Map<string, number>();
  for (const [key, list] of buckets) if (list.length >= minSamples) learned.set(key, median(list));
  return {
    // Learned turns already include bussing time, so the reset is folded in.
    forSize: (n) => {
      const m = learned.get(bucket(n));
      return m === undefined ? base.forSize(n) : Math.max(5, m - base.reset);
    },
    reset: base.reset,
  };
}

function bucket(n: number): string {
  return n <= 2 ? "small" : n <= 4 ? "medium" : "large";
}

function median(list: number[]): number {
  const s = [...list].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

interface Opening {
  seat: Seat;
  at: number;
}

/** When each active seat is expected to be free next. */
export function openings(state: FloorState, turns: Turns, now: number): Opening[] {
  const out: Opening[] = openSeats(state).map((seat) => ({ seat, at: now }));
  for (const v of holdingVisits(state)) {
    let at: number;
    if (v.status === "left") at = (v.guestsLeftAt ?? now) + turns.reset * MIN;
    else at = (v.seatedAt ?? now) + (turns.forSize(v.size) + turns.reset) * MIN;
    at = Math.max(at, now + MIN); // never "free right now" while someone is there
    for (const code of v.seatCodes) {
      const seat = state.seats.find((s) => s.code === code && s.active);
      if (seat) out.push({ seat, at });
    }
  }
  return out;
}

type Kind = "table" | "bar";

/** Earliest time `size` guests could sit at this kind of seat, using and updating the openings. */
function take(open: Opening[], size: number, kind: Kind, turns: Turns): number | null {
  if (kind === "table") {
    const fits = open
      .filter((o) => o.seat.kind === "table" && o.seat.capacity >= size)
      .sort((a, b) => a.at - b.at || a.seat.capacity - b.seat.capacity);
    if (!fits.length) return null;
    const pick = fits[0];
    const at = pick.at;
    pick.at = at + (turns.forSize(size) + turns.reset) * MIN;
    return at;
  }
  const bar = open.filter((o) => o.seat.kind === "bar").sort((a, b) => a.at - b.at);
  if (bar.length < size) return null;
  const chosen = bar.slice(0, size);
  const at = chosen[chosen.length - 1].at;
  for (const o of chosen) o.at = at + (turns.forSize(size) + turns.reset) * MIN;
  return at;
}

function kindsFor(choice: SeatingChoice): Kind[] {
  return choice === "table" ? ["table"] : choice === "bar_ok" ? ["bar", "table"] : ["table", "bar"];
}

/** Minutes until a seat of this kind is expected for a party that joins the end of the line now. */
export function waitMinutes(
  state: FloorState,
  party: { size: number; kind: Kind },
  turns: Turns,
  now: number,
  /** Quote for a party already in line: only parties ahead of it count. */
  visitId?: string,
): number | null {
  const open = openings(state, turns, now);
  const line = waitlist(state);
  const stop = visitId ? line.findIndex((v) => v.id === visitId) : line.length;
  for (const v of line.slice(0, stop < 0 ? line.length : stop)) {
    let got: number | null = null;
    for (const k of kindsFor(v.choice)) {
      got = take(open, v.size, k, turns);
      if (got !== null) break;
    }
  }
  const at = take(open, party.size, party.kind, turns);
  if (at === null) return null;
  return Math.max(0, Math.round((at - now) / MIN));
}

export interface Quote {
  table: number | null;
  bar: number | null;
}

/** Table and bar waits for a new party of this size. */
export function quote(state: FloorState, size: number, turns: Turns, now: number): Quote {
  return {
    table: waitMinutes(state, { size, kind: "table" }, turns, now),
    bar: size <= state.seats.filter((s) => s.kind === "bar" && s.active).length ? waitMinutes(state, { size, kind: "bar" }, turns, now) : null,
  };
}

/** The wait for a party in line, given its choice. */
export function waitFor(state: FloorState, visit: Visit, turns: Turns, now: number): number | null {
  const options = kindsFor(visit.choice)
    .map((kind) => waitMinutes(state, { size: visit.size, kind }, turns, now, visit.id))
    .filter((m): m is number => m !== null);
  return options.length ? Math.min(...options) : null;
}

/** The wait a choice gets, from a two-way quote. */
export function quoteForChoice(q: Quote, choice: SeatingChoice): number | null {
  const opts = (choice === "table" ? [q.table] : [q.table, q.bar]).filter((m): m is number => m !== null);
  return opts.length ? Math.min(...opts) : null;
}

/** "Seated now", "about 5 minutes", "about 15 to 20 minutes". */
export function describeWait(minutes: number | null): string {
  if (minutes === null) return "Ask our staff";
  if (minutes <= 2) return "Seating now";
  const lo = Math.max(5, Math.round(minutes / 5) * 5);
  if (lo <= 5) return "About 5 minutes";
  return `About ${lo} to ${lo + 5} minutes`;
}

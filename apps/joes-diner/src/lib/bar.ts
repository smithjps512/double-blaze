import type { Seat } from "./types";

/**
 * Bar parties sit side by side. Given the open bar seats, pick `n` seats in a
 * row that keep the remaining open seats together:
 *
 *  1. the seats must be in one run of open seats (required),
 *  2. a run that fits exactly is best,
 *  3. otherwise sit at the end of a run, never in the middle.
 *
 * Among equally good choices, the smallest run that fits wins (so big runs
 * stay free for bigger groups), then the run nearest the start of the bar.
 */

/** Runs of consecutive open bar seats, in bar order. */
export function openRuns(openBarSeats: Seat[]): Seat[][] {
  const sorted = [...openBarSeats].filter((s) => s.kind === "bar").sort((a, b) => a.position - b.position);
  const runs: Seat[][] = [];
  for (const seat of sorted) {
    const last = runs[runs.length - 1];
    if (last && seat.position === last[last.length - 1].position + 1) last.push(seat);
    else runs.push([seat]);
  }
  return runs;
}

/** The seats to suggest, or null when no run is long enough. */
export function pickBarSeats(openBarSeats: Seat[], n: number): string[] | null {
  if (n < 1) return null;
  const runs = openRuns(openBarSeats).filter((r) => r.length >= n);
  if (runs.length === 0) return null;
  const exact = runs.find((r) => r.length === n);
  const run = exact ?? [...runs].sort((a, b) => a.length - b.length || a[0].position - b[0].position)[0];
  return run.slice(0, n).map((s) => s.code);
}

/** The longest group the bar can seat right now. */
export function longestRun(openBarSeats: Seat[]): number {
  return Math.max(0, ...openRuns(openBarSeats).map((r) => r.length));
}

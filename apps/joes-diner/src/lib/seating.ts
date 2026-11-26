import { pickBarSeats } from "./bar";
import { openSeats, waitlist } from "./floor-view";
import type { FloorState, Seat, Visit } from "./types";

/**
 * Seating suggestions for the staff screen. Walk the waitlist in line order
 * and give each party the best open seats that fit its choice and size. Seats
 * given to an earlier party are not offered to a later one. Parties that are
 * not all here are passed over without losing their place.
 *
 *  - Table only: tables.
 *  - Bar is fine: bar seats side by side first, then a table.
 *  - First available: a table first, then bar seats. A small party is
 *    offered bar seats before a table for 5 or more.
 *  - Tables: the smallest table that fits. With protectLargeTables on, a
 *    table for 5 or more is not suggested to a party of 4 or fewer while a
 *    party of 5 or more is waiting and all here.
 *  - Parties larger than any one table get no suggestion; staff seat them
 *    across tables by hand.
 *
 * Suggestions are only suggestions. Staff can seat anyone anywhere.
 */

export interface Suggestion {
  visitId: string;
  seatCodes: string[];
}

export const LARGE_PARTY = 5;

export function suggest(state: FloorState): Suggestion[] {
  const line = waitlist(state);
  const largeWaiting = line.some((v) => v.allHere && v.size >= LARGE_PARTY);
  let free = openSeats(state);
  const out: Suggestion[] = [];

  for (const visit of line) {
    if (!visit.allHere) continue;
    const codes = seatsFor(visit, free, state.settings.protectLargeTables && largeWaiting);
    if (!codes) continue;
    out.push({ visitId: visit.id, seatCodes: codes });
    free = free.filter((s) => !codes.includes(s.code));
  }
  return out;
}

export function seatsFor(visit: Pick<Visit, "size" | "choice">, free: Seat[], protectLarge: boolean): string[] | null {
  const table = () => pickTable(free, visit.size, protectLarge);
  const bar = () => pickBarSeats(free.filter((s) => s.kind === "bar"), visit.size);
  switch (visit.choice) {
    case "table":
      return table();
    case "bar_ok":
      return bar() ?? table();
    case "any": {
      // First available prefers a table, but not a big table for a small
      // party when bar seats would do.
      const t = table();
      const big = t ? (free.find((s) => s.code === t[0])?.capacity ?? 0) >= LARGE_PARTY && visit.size < LARGE_PARTY : false;
      return big ? (bar() ?? t) : (t ?? bar());
    }
  }
}

export function pickTable(free: Seat[], size: number, protectLarge: boolean): string[] | null {
  const fits = free
    .filter((s) => s.kind === "table" && s.capacity >= size)
    .filter((s) => !(protectLarge && size < LARGE_PARTY && s.capacity >= LARGE_PARTY))
    .sort((a, b) => a.capacity - b.capacity || a.position - b.position);
  return fits.length ? [fits[0].code] : null;
}

/** The suggestion for one party, if any. */
export function suggestionFor(suggestions: Suggestion[], visitId: string): Suggestion | null {
  return suggestions.find((s) => s.visitId === visitId) ?? null;
}

import type { FloorState, Seat, Settings } from "./types";

/**
 * Joe's floor and starting settings. Table capacities are placeholders until
 * the per-table counts come back from the diner (an open item in the brief):
 * mostly 4-person booths, with two tables that seat 7.
 */

export const DEFAULT_SEATS: Seat[] = [
  ...[101, 102, 103, 104, 105, 106, 107, 108, 109, 110].map((n, i) => ({
    code: String(n),
    kind: "table" as const,
    capacity: n === 105 || n === 110 ? 7 : 4,
    position: i + 1,
    active: true,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    code: `bar${i + 1}`,
    kind: "bar" as const,
    capacity: 1,
    position: i + 1,
    active: true,
  })),
];

export const DEFAULT_SETTINGS: Settings = {
  holdSeconds: 60,
  protectLargeTables: true,
  turnMinutes: { small: 35, medium: 45, large: 55 },
  resetMinutes: 5,
  menuUrl: "",
  reviewUrl: "",
};

export function emptyFloor(shiftId: string, businessDate: string, settings: Settings = DEFAULT_SETTINGS, seats: Seat[] = DEFAULT_SEATS): FloorState {
  return {
    shiftId,
    businessDate,
    openedAt: null,
    closedAt: null,
    version: 0,
    seats: structuredClone(seats),
    servers: [],
    visits: [],
    tickets: [],
    settings: structuredClone(settings),
  };
}

/** Joe's business date, in Eastern time (the diner is in Virginia). */
export function businessDate(now: number, timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

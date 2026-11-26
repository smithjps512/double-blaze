import type { ShiftServer } from "./types";

/**
 * The clipboard rule. Each server's total is their virtual starting number
 * plus the guests actually seated with them. The lowest total gets the next
 * party. Ties go to whoever was seated longest ago; a server with no seating
 * yet counts from the time they joined.
 */

export function total(s: ShiftServer): number {
  return s.offset + s.actual;
}

export function onFloor(servers: ShiftServer[]): ShiftServer[] {
  return servers.filter((s) => s.leftAt === null);
}

/** Servers who can take the next party: on the floor and not paused. */
export function available(servers: ShiftServer[]): ShiftServer[] {
  return onFloor(servers).filter((s) => !s.paused);
}

/** Who gets the next party, or null if nobody is available. */
export function nextUp(servers: ShiftServer[]): ShiftServer | null {
  const pool = available(servers);
  if (pool.length === 0) return null;
  return [...pool].sort(compare)[0];
}

/** Rotation order for the staff screen: next up first. */
export function order(servers: ShiftServer[]): ShiftServer[] {
  return [...available(servers)].sort(compare);
}

function compare(a: ShiftServer, b: ShiftServer): number {
  const d = total(a) - total(b);
  if (d !== 0) return d;
  const at = a.lastSeatedAt ?? a.joinedAt;
  const bt = b.lastSeatedAt ?? b.joinedAt;
  if (at !== bt) return at - bt;
  return a.name.localeCompare(b.name);
}

/**
 * The starting number for a server joining now: tied with the current lowest
 * total, so they do not get every table until they catch up. Zero when they
 * are the first one on.
 */
export function joiningOffset(servers: ShiftServer[]): number {
  const pool = onFloor(servers);
  if (pool.length === 0) return 0;
  return Math.min(...pool.map(total));
}

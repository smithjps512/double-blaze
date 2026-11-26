import type { FloorState, ShiftServer, Ticket, Visit } from "./types";

/**
 * What changed between two floor states, so a commit only sends the rows
 * that actually changed.
 */
export interface Changes {
  servers: ShiftServer[];
  visits: Visit[];
  tickets: Ticket[];
}

export function changes(prev: FloorState, next: FloorState): Changes {
  return {
    servers: changed(prev.servers, next.servers, (s) => s.staffId),
    visits: changed(prev.visits, next.visits, (v) => v.id),
    tickets: changed(prev.tickets, next.tickets, (t) => t.id),
  };
}

function changed<T>(before: T[], after: T[], key: (x: T) => string): T[] {
  const old = new Map(before.map((x) => [key(x), JSON.stringify(x)]));
  return after.filter((x) => old.get(key(x)) !== JSON.stringify(x));
}

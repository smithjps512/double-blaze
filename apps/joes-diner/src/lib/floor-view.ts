import type { FloorState, Seat, Visit } from "./types";

/**
 * Read-only questions about the floor: which seats are taken, who is waiting.
 * Shared by the rules, the actions, and the screens.
 */

export type SeatState = "open" | "seated" | "food_ready" | "needs_bussing";

/** Visits that hold seats right now (seated, or left and not yet bused). */
export function holdingVisits(state: FloorState): Visit[] {
  return state.visits.filter((v) => v.status === "seated" || v.status === "left");
}

export function visitAtSeat(state: FloorState, code: string): Visit | null {
  return holdingVisits(state).find((v) => v.seatCodes.includes(code)) ?? null;
}

export function seatState(state: FloorState, code: string): SeatState {
  const v = visitAtSeat(state, code);
  if (!v) return "open";
  if (v.status === "left") return "needs_bussing";
  const waitingFood = state.tickets.some((t) => t.visitId === v.id && t.seatCode === code && t.pickedUpAt === null);
  return waitingFood ? "food_ready" : "seated";
}

export function openSeats(state: FloorState): Seat[] {
  const taken = new Set(holdingVisits(state).flatMap((v) => v.seatCodes));
  return state.seats.filter((s) => s.active && !taken.has(s.code));
}

/** The waitlist in line order (waiting and called parties). */
export function waitlist(state: FloorState): Visit[] {
  return state.visits
    .filter((v) => v.status === "waiting" || v.status === "called")
    .sort((a, b) => a.queueAt - b.queueAt || a.checkedInAt - b.checkedInAt);
}

export function findVisit(state: FloorState, id: string): Visit | null {
  return state.visits.find((v) => v.id === id) ?? null;
}

export function findByToken(state: FloorState, token: string): Visit | null {
  return state.visits.find((v) => v.token === token) ?? null;
}

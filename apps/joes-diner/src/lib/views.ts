import { seatsLabel } from "./floor";
import { seatState, waitlist, type SeatState } from "./floor-view";
import { nextUp, onFloor, total } from "./rotation";
import { suggest, suggestionFor } from "./seating";
import type { FloorState, SeatingChoice, Staff, Visit, VisitStatus } from "./types";
import { describeWait, quote, waitFor, type Turns } from "./wait";

/**
 * What each screen needs, and nothing more. The check-in and guest views
 * never include phone numbers or anyone else's private link.
 */

export interface StaffSeat {
  code: string;
  kind: "table" | "bar";
  capacity: number;
  state: SeatState;
  visit: { id: string; name: string; size: number; server: string | null; seatedAt: number | null; guestsLeftAt: number | null; seatsLabel: string } | null;
  foodReadyAt: number | null;
}

export interface StaffLine {
  id: string;
  name: string;
  size: number;
  choice: SeatingChoice;
  status: VisitStatus;
  allHere: boolean;
  source: Visit["source"];
  checkedInAt: number;
  calledAt: number | null;
  waitMinutes: number | null;
  suggestion: string[] | null;
  suggestionLabel: string | null;
}

export interface StaffServer {
  staffId: string;
  name: string;
  total: number;
  actual: number;
  paused: boolean;
  next: boolean;
  tables: number;
}

export interface StaffView {
  now: number;
  version: number;
  open: boolean;
  closed: boolean;
  holdSeconds: number;
  seats: StaffSeat[];
  line: StaffLine[];
  servers: StaffServer[];
  offFloor: { id: string; name: string }[];
  nextUp: string | null;
  today: { guests: number; parties: number; waiting: number };
}

export function staffView(state: FloorState, staff: Staff[], turns: Turns, now: number): StaffView {
  const names = new Map(state.servers.map((s) => [s.staffId, s.name]));
  const suggestions = suggest(state);
  const next = nextUp(state.servers);
  const holders = state.visits.filter((v) => v.status === "seated" || v.status === "left");
  const onIds = new Set(onFloor(state.servers).map((s) => s.staffId));
  return {
    now,
    version: state.version,
    open: state.openedAt !== null && state.closedAt === null,
    closed: state.closedAt !== null,
    holdSeconds: state.settings.holdSeconds,
    seats: state.seats
      .filter((s) => s.active)
      .map((s) => {
        const v = holders.find((h) => h.seatCodes.includes(s.code)) ?? null;
        const ready = state.tickets.filter((t) => t.seatCode === s.code && t.pickedUpAt === null && v && t.visitId === v.id);
        return {
          code: s.code,
          kind: s.kind,
          capacity: s.capacity,
          state: seatState(state, s.code),
          visit: v
            ? {
                id: v.id,
                name: v.name,
                size: v.size,
                server: v.serverId ? names.get(v.serverId) ?? null : null,
                seatedAt: v.seatedAt,
                guestsLeftAt: v.guestsLeftAt,
                seatsLabel: seatsLabel(v.seatCodes),
              }
            : null,
          foodReadyAt: ready.length ? Math.min(...ready.map((t) => t.readyAt)) : null,
        };
      }),
    line: waitlist(state).map((v) => {
      const sug = suggestionFor(suggestions, v.id);
      return {
        id: v.id,
        name: v.name,
        size: v.size,
        choice: v.choice,
        status: v.status,
        allHere: v.allHere,
        source: v.source,
        checkedInAt: v.checkedInAt,
        calledAt: v.calledAt,
        waitMinutes: waitFor(state, v, turns, now),
        suggestion: sug?.seatCodes ?? null,
        suggestionLabel: sug ? seatsLabel(sug.seatCodes) : null,
      };
    }),
    servers: onFloor(state.servers)
      .map((s) => ({
        staffId: s.staffId,
        name: s.name,
        total: total(s),
        actual: s.actual,
        paused: s.paused,
        next: next?.staffId === s.staffId,
        tables: holders.filter((h) => h.serverId === s.staffId && h.status === "seated").length,
      }))
      .sort((a, b) => Number(b.next) - Number(a.next) || a.total - b.total),
    offFloor: staff.filter((s) => s.active && s.role === "server" && !onIds.has(s.id)).map((s) => ({ id: s.id, name: s.name })),
    nextUp: next?.name ?? null,
    today: {
      guests: state.visits.filter((v) => v.seatedAt !== null).reduce((n, v) => n + v.size, 0),
      parties: state.visits.filter((v) => v.seatedAt !== null).length,
      waiting: waitlist(state).length,
    },
  };
}

/** First name plus last initial would hide too little in a diner; show what the guest typed. */
export interface PublicLine {
  name: string;
  size: number;
  wait: string;
  called: boolean;
}

export interface CheckinView {
  open: boolean;
  /** Waits for each party size 1 to 8, as [table, bar] minutes. */
  quotes: Record<number, { table: number | null; bar: number | null }>;
  line: PublicLine[];
  nowSeating: string[];
  holdSeconds: number;
  menuUrl: string;
}

export function checkinView(state: FloorState, turns: Turns, now: number): CheckinView {
  const quotes: CheckinView["quotes"] = {};
  for (let n = 1; n <= 8; n++) quotes[n] = quote(state, n, turns, now);
  return {
    open: state.openedAt !== null && state.closedAt === null,
    quotes,
    line: waitlist(state).map((v) => ({
      name: v.name,
      size: v.size,
      wait: v.status === "called" ? "Your table is ready" : describeWait(waitFor(state, v, turns, now), true),
      called: v.status === "called",
    })),
    nowSeating: state.visits
      .filter((v) => v.seatedAt !== null && now - v.seatedAt < 3 * 60_000)
      .sort((a, b) => b.seatedAt! - a.seatedAt!)
      .map((v) => v.name),
    holdSeconds: state.settings.holdSeconds,
    menuUrl: state.settings.menuUrl,
  };
}

export interface PartyView {
  name: string;
  size: number;
  status: VisitStatus;
  position: number | null;
  ahead: number | null;
  wait: string;
  seats: string | null;
  allHere: boolean;
  holdSeconds: number;
  menuUrl: string;
}

export function partyView(state: FloorState, v: Visit, turns: Turns, now: number): PartyView {
  const line = waitlist(state);
  const i = line.findIndex((x) => x.id === v.id);
  return {
    name: v.name,
    size: v.size,
    status: v.status,
    position: i >= 0 ? i + 1 : null,
    ahead: i >= 0 ? i : null,
    wait:
      v.status === "called"
        ? "Your table is ready. Please come to the front now."
        : v.status === "waiting"
          ? describeWait(waitFor(state, v, turns, now), true)
          : "",
    seats: v.seatCodes.length ? seatsLabel(v.seatCodes) : null,
    allHere: v.allHere,
    holdSeconds: state.settings.holdSeconds,
    menuUrl: state.settings.menuUrl,
  };
}

/** What the table tablet shows. Only the name the guest gave, never their phone. */
export interface TableView {
  code: string;
  label: string;
  state: SeatState;
  name: string | null;
  menuUrl: string;
}

export function tableView(state: FloorState, code: string): TableView {
  const v = state.visits.find((x) => (x.status === "seated" || x.status === "left") && x.seatCodes.includes(code));
  return {
    code,
    label: seatsLabel([code]),
    state: seatState(state, code),
    name: v?.name ?? null,
    menuUrl: state.settings.menuUrl,
  };
}

export { waitlist };

import { findVisit, openSeats, visitAtSeat } from "./floor-view";
import { joiningOffset, nextUp } from "./rotation";
import type { FloorEvent, FloorState, SeatingChoice, ShiftServer, Visit, VisitSource } from "./types";

/**
 * Every change to the floor. `apply` takes the current state and an action
 * and returns the new state plus the events to record. It never mutates its
 * input, and it rejects anything that does not make sense (seating a party
 * at a taken seat, marking an open table ready) with a FloorError whose
 * message is written for staff.
 *
 * The same function runs in demo mode (in memory) and with Supabase (where
 * the new state and events are saved together in one transaction), so the
 * floor and its history can never disagree.
 */

export type Action =
  | { type: "open_shift" }
  | { type: "close_shift" }
  | { type: "server_join"; staffId: string; name: string }
  | { type: "server_pause"; staffId: string }
  | { type: "server_resume"; staffId: string }
  | { type: "server_leave"; staffId: string }
  | {
      type: "check_in";
      name: string;
      size: number;
      choice: SeatingChoice;
      source: VisitSource;
      allHere: boolean;
      phone?: string | null;
      textConsent?: boolean;
      quotedMinutes?: number | null;
    }
  | { type: "set_all_here"; visitId: string; allHere: boolean }
  | { type: "call"; visitId: string }
  | { type: "skip"; visitId: string }
  | { type: "seat"; visitId: string; seatCodes: string[]; serverId?: string | null }
  | { type: "undo_seat"; visitId: string }
  | { type: "food_ready"; seatCode: string }
  | { type: "food_picked_up"; ticketId: string }
  | { type: "guests_left"; seatCode: string }
  | { type: "table_ready"; seatCode: string; staffId: string }
  | { type: "no_show"; visitId: string }
  | { type: "leave_list"; visitId: string };

export interface Context {
  now: number;
  newId: () => string;
  newToken: () => string;
  deviceId?: string;
}

export interface Result {
  state: FloorState;
  events: FloorEvent[];
  /** The visit an action created or acted on, when there is one. */
  visitId?: string;
}

export class FloorError extends Error {}

const MAX_PARTY = 30;

export function apply(prev: FloorState, action: Action, ctx: Context): Result {
  const state: FloorState = structuredClone(prev);
  const events: FloorEvent[] = [];
  const { now } = ctx;
  const emit = (e: Omit<FloorEvent, "at">) => events.push({ at: now, deviceId: ctx.deviceId, ...e });
  let visitId: string | undefined;

  const open = () => {
    if (state.openedAt === null || state.closedAt !== null) throw new FloorError("The day is not open yet.");
  };
  const server = (id: string): ShiftServer => {
    const s = state.servers.find((x) => x.staffId === id && x.leftAt === null);
    if (!s) throw new FloorError("That server is not on the floor.");
    return s;
  };
  const visit = (id: string): Visit => {
    const v = findVisit(state, id);
    if (!v) throw new FloorError("That party is not on the list.");
    return v;
  };
  const inLine = (v: Visit) => {
    if (v.status !== "waiting" && v.status !== "called") throw new FloorError(`${v.name} is not waiting.`);
  };

  switch (action.type) {
    case "open_shift": {
      if (state.openedAt !== null && state.closedAt === null) throw new FloorError("The day is already open.");
      state.openedAt = now;
      state.closedAt = null;
      emit({ type: "shift_opened" });
      break;
    }
    case "close_shift": {
      open();
      state.closedAt = now;
      for (const s of state.servers) if (s.leftAt === null) s.leftAt = now;
      emit({ type: "shift_closed" });
      break;
    }
    case "server_join": {
      open();
      if (state.servers.some((s) => s.staffId === action.staffId && s.leftAt === null)) {
        throw new FloorError(`${action.name} is already on the floor.`);
      }
      const offset = joiningOffset(state.servers);
      const earlier = state.servers.find((s) => s.staffId === action.staffId);
      if (earlier) {
        // Back for a second stretch: keep their real count, restart the offset.
        earlier.leftAt = null;
        earlier.paused = false;
        earlier.offset = Math.max(0, offset - earlier.actual);
        earlier.joinedAt = now;
      } else {
        state.servers.push({
          staffId: action.staffId,
          name: action.name,
          joinedAt: now,
          leftAt: null,
          offset,
          actual: 0,
          paused: false,
          lastSeatedAt: null,
        });
      }
      emit({ type: "server_joined", staffId: action.staffId, data: { offset } });
      break;
    }
    case "server_pause": {
      server(action.staffId).paused = true;
      emit({ type: "server_paused", staffId: action.staffId });
      break;
    }
    case "server_resume": {
      server(action.staffId).paused = false;
      emit({ type: "server_resumed", staffId: action.staffId });
      break;
    }
    case "server_leave": {
      server(action.staffId).leftAt = now;
      emit({ type: "server_left", staffId: action.staffId });
      break;
    }
    case "check_in": {
      open();
      const name = action.name.trim().replace(/\s+/g, " ").slice(0, 40);
      if (!name) throw new FloorError("Please enter a name.");
      if (!Number.isInteger(action.size) || action.size < 1 || action.size > MAX_PARTY) {
        throw new FloorError("Please choose a party size.");
      }
      const v: Visit = {
        id: ctx.newId(),
        token: ctx.newToken(),
        name,
        size: action.size,
        choice: action.choice,
        source: action.source,
        phone: action.phone ?? null,
        textConsent: Boolean(action.phone && action.textConsent),
        status: "waiting",
        allHere: action.allHere,
        checkedInAt: now,
        queueAt: now,
        quotedMinutes: action.quotedMinutes ?? null,
        calledAt: null,
        seatedAt: null,
        serverId: null,
        override: false,
        seatCodes: [],
        firstFoodReadyAt: null,
        guestsLeftAt: null,
        tableReadyAt: null,
        readyBy: null,
        endedAt: null,
      };
      state.visits.push(v);
      visitId = v.id;
      emit({ type: "checked_in", visitId: v.id, data: { size: v.size, choice: v.choice, source: v.source, allHere: v.allHere } });
      if (v.quotedMinutes !== null) emit({ type: "wait_quoted", visitId: v.id, data: { minutes: v.quotedMinutes } });
      break;
    }
    case "set_all_here": {
      const v = visit(action.visitId);
      inLine(v);
      v.allHere = action.allHere;
      visitId = v.id;
      emit({ type: "marked_all_here", visitId: v.id, data: { allHere: v.allHere } });
      break;
    }
    case "call": {
      const v = visit(action.visitId);
      inLine(v);
      v.status = "called";
      v.calledAt = now;
      visitId = v.id;
      emit({ type: "called", visitId: v.id });
      break;
    }
    case "skip": {
      // Not here when called: move to second in line, keep them near the top.
      const v = visit(action.visitId);
      inLine(v);
      const others = state.visits
        .filter((x) => x.id !== v.id && (x.status === "waiting" || x.status === "called"))
        .sort((a, b) => a.queueAt - b.queueAt);
      if (others.length) {
        const first = others[0].queueAt;
        const second = others[1]?.queueAt;
        v.queueAt = second === undefined ? first + 1 : (first + second) / 2;
      }
      v.status = "waiting";
      v.calledAt = null;
      visitId = v.id;
      emit({ type: "skipped", visitId: v.id });
      break;
    }
    case "seat": {
      open();
      const v = visit(action.visitId);
      inLine(v);
      const codes = [...new Set(action.seatCodes)];
      if (!codes.length) throw new FloorError("Pick a table or bar seats.");
      const free = new Set(openSeats(state).map((s) => s.code));
      for (const code of codes) {
        if (!state.seats.some((s) => s.code === code && s.active)) throw new FloorError(`There is no seat ${code}.`);
        if (!free.has(code)) throw new FloorError(`${label(code)} is not open.`);
      }
      const auto = nextUp(state.servers);
      const chosen = action.serverId ? server(action.serverId) : auto;
      if (!chosen) throw new FloorError("No server is on the floor. Add a server first.");
      const override = Boolean(action.serverId && auto && action.serverId !== auto.staffId);
      v.status = "seated";
      v.seatedAt = now;
      v.seatCodes = codes;
      v.serverId = chosen.staffId;
      v.override = override;
      v.allHere = true;
      chosen.actual += v.size;
      chosen.lastSeatedAt = now;
      visitId = v.id;
      emit({ type: "seated", visitId: v.id, seatCodes: codes, data: { size: v.size } });
      emit({ type: "server_assigned", visitId: v.id, staffId: chosen.staffId, data: { override, guests: v.size } });
      break;
    }
    case "undo_seat": {
      const v = visit(action.visitId);
      if (v.status !== "seated") throw new FloorError(`${v.name} is not seated.`);
      if (state.tickets.some((t) => t.visitId === v.id)) throw new FloorError("Food has already been fired for this party.");
      const s = state.servers.find((x) => x.staffId === v.serverId);
      if (s) s.actual = Math.max(0, s.actual - v.size);
      const seats = v.seatCodes;
      v.status = "waiting";
      v.seatedAt = null;
      v.seatCodes = [];
      v.serverId = null;
      v.override = false;
      visitId = v.id;
      emit({ type: "seating_undone", visitId: v.id, seatCodes: seats, staffId: s?.staffId });
      break;
    }
    case "food_ready": {
      const v = visitAtSeat(state, action.seatCode);
      if (!v || v.status !== "seated") throw new FloorError(`Nobody is seated at ${label(action.seatCode)}.`);
      const ticket = { id: ctx.newId(), visitId: v.id, seatCode: action.seatCode, readyAt: now, pickedUpAt: null };
      state.tickets.push(ticket);
      if (v.firstFoodReadyAt === null) v.firstFoodReadyAt = now;
      visitId = v.id;
      emit({ type: "food_ready", visitId: v.id, seatCodes: [action.seatCode], data: { ticketId: ticket.id } });
      break;
    }
    case "food_picked_up": {
      const t = state.tickets.find((x) => x.id === action.ticketId);
      if (!t) throw new FloorError("That ticket is gone.");
      if (t.pickedUpAt !== null) break;
      t.pickedUpAt = now;
      visitId = t.visitId;
      emit({ type: "food_picked_up", visitId: t.visitId, seatCodes: [t.seatCode], data: { ticketId: t.id } });
      break;
    }
    case "guests_left": {
      const v = visitAtSeat(state, action.seatCode);
      if (!v) throw new FloorError(`Nobody is at ${label(action.seatCode)}.`);
      if (v.status === "left") break;
      v.status = "left";
      v.guestsLeftAt = now;
      for (const t of state.tickets) if (t.visitId === v.id && t.pickedUpAt === null) t.pickedUpAt = now;
      visitId = v.id;
      emit({ type: "guests_left", visitId: v.id, seatCodes: v.seatCodes });
      break;
    }
    case "table_ready": {
      const v = visitAtSeat(state, action.seatCode);
      if (!v) throw new FloorError(`${label(action.seatCode)} is already open.`);
      if (!action.staffId) throw new FloorError("Enter your code.");
      v.status = "done";
      v.tableReadyAt = now;
      v.readyBy = action.staffId;
      v.endedAt = now;
      for (const t of state.tickets) if (t.visitId === v.id && t.pickedUpAt === null) t.pickedUpAt = now;
      visitId = v.id;
      emit({ type: "table_ready", visitId: v.id, seatCodes: v.seatCodes, staffId: action.staffId });
      break;
    }
    case "no_show": {
      const v = visit(action.visitId);
      inLine(v);
      v.status = "no_show";
      v.endedAt = now;
      visitId = v.id;
      emit({ type: "no_show", visitId: v.id });
      break;
    }
    case "leave_list": {
      const v = visit(action.visitId);
      inLine(v);
      v.status = "left_list";
      v.endedAt = now;
      visitId = v.id;
      emit({ type: "left_list", visitId: v.id });
      break;
    }
  }

  state.version = prev.version + 1;
  return { state, events, visitId };
}

/** "Table 104" or "Bar 3". */
export function label(code: string): string {
  return code.startsWith("bar") ? `Bar ${code.slice(3)}` : `Table ${code}`;
}

/** A short list label for several seats: "Table 104", "Bar 3 to 5", "Tables 101 and 102". */
export function seatsLabel(codes: string[]): string {
  if (!codes.length) return "";
  if (codes.length === 1) return label(codes[0]);
  if (codes.every((c) => c.startsWith("bar"))) {
    const nums = codes.map((c) => Number(c.slice(3))).sort((a, b) => a - b);
    return `Bar ${nums[0]} to ${nums[nums.length - 1]}`;
  }
  return `Tables ${codes.join(" and ")}`;
}

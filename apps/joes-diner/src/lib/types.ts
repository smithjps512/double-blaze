/**
 * The floor model for Welcome to Joe's. One business day ("shift") holds the
 * seats, the servers working it, every visit (one party's stay), and the food
 * tickets. Every change to it goes through `apply` in floor.ts, which also
 * returns the events to record. See docs/clients/joes-diner/build-plan.md.
 */

export type SeatKind = "table" | "bar";

export interface Seat {
  /** "101" to "110", "bar1" to "bar9". */
  code: string;
  kind: SeatKind;
  capacity: number;
  /** Order on the floor. For bar seats this is the position along the bar. */
  position: number;
  active: boolean;
}

/** Table only, Bar is fine, or First available. */
export type SeatingChoice = "table" | "bar_ok" | "any";

export type VisitStatus =
  | "waiting"
  | "called"
  | "seated"
  /** Guests left, table needs bussing (the pilot). */
  | "left"
  /** Table ready again. The visit is over. */
  | "done"
  | "no_show"
  | "left_list";

export type VisitSource = "counter" | "qr" | "staff";

export interface Visit {
  id: string;
  /** Private link for the guest's status page. */
  token: string;
  name: string;
  size: number;
  choice: SeatingChoice;
  source: VisitSource;
  phone: string | null;
  textConsent: boolean;
  status: VisitStatus;
  /** The whole party is here. Parties that are not are passed over. */
  allHere: boolean;
  checkedInAt: number;
  /** Place in line. Starts as check-in time; a skip moves it. */
  queueAt: number;
  quotedMinutes: number | null;
  calledAt: number | null;
  seatedAt: number | null;
  serverId: string | null;
  override: boolean;
  seatCodes: string[];
  firstFoodReadyAt: number | null;
  guestsLeftAt: number | null;
  tableReadyAt: number | null;
  readyBy: string | null;
  endedAt: number | null;
}

export interface Staff {
  id: string;
  name: string;
  role: "server" | "cook" | "manager";
  active: boolean;
}

export interface ShiftServer {
  staffId: string;
  name: string;
  joinedAt: number;
  leftAt: number | null;
  /** The virtual starting number given to someone who joins mid-shift. */
  offset: number;
  /** Guests actually seated with this server. Reports use only this. */
  actual: number;
  paused: boolean;
  lastSeatedAt: number | null;
}

export interface Ticket {
  id: string;
  visitId: string;
  seatCode: string;
  readyAt: number;
  pickedUpAt: number | null;
}

export interface Settings {
  holdSeconds: number;
  /** Do not suggest a 5+ table for a small party while a large one waits. */
  protectLargeTables: boolean;
  /** Typical minutes from seated to table ready, before real data exists. */
  turnMinutes: { small: number; medium: number; large: number };
  resetMinutes: number;
  menuUrl: string;
  reviewUrl: string;
}

export interface FloorState {
  shiftId: string;
  businessDate: string;
  openedAt: number | null;
  closedAt: number | null;
  /** Increments on every change; used to reject stale writes. */
  version: number;
  seats: Seat[];
  servers: ShiftServer[];
  visits: Visit[];
  tickets: Ticket[];
  settings: Settings;
}

export type EventType =
  | "shift_opened"
  | "shift_closed"
  | "server_joined"
  | "server_paused"
  | "server_resumed"
  | "server_left"
  | "checked_in"
  | "wait_quoted"
  | "marked_all_here"
  | "called"
  | "skipped"
  | "seated"
  | "server_assigned"
  | "seating_undone"
  | "food_ready"
  | "food_picked_up"
  | "guests_left"
  | "table_ready"
  | "no_show"
  | "left_list";

export interface FloorEvent {
  type: EventType;
  at: number;
  visitId?: string;
  seatCodes?: string[];
  staffId?: string;
  deviceId?: string;
  data?: Record<string, unknown>;
}

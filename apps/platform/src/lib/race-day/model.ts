/**
 * Race Day: real CO2 dragster runs timed from video, and the honest way to
 * rank them.
 *
 * Pure logic with no server or browser dependencies, so the leaderboard, the
 * lesson, the teacher screen and the tests all agree on one rule for ties.
 *
 * Times are handled in whole milliseconds. Floating point seconds would make
 * 1.33 minus 1.28 come out a hair over 0.05 and quietly split a tie that the
 * footage cannot split. No em dashes in any copy here.
 */

export type Quality = "ok" | "finish_gate_out_of_frame" | "finish_gate_partly_out_of_frame" | "slow_launch";

export const QUALITIES: Quality[] = ["ok", "finish_gate_out_of_frame", "finish_gate_partly_out_of_frame", "slow_launch"];

export const QUALITY_LABEL: Record<Quality, string> = {
  ok: "Clean",
  finish_gate_out_of_frame: "Finish gate out of frame",
  finish_gate_partly_out_of_frame: "Finish gate partly out of frame",
  slow_launch: "Slow launch",
};

export const QUALITY_EXPLAIN: Record<Quality, string> = {
  ok: "Start and finish were both clear on the video.",
  finish_gate_out_of_frame:
    "The finish gate was not in the shot, so the finish was read as the car leaving the frame. The true time is probably a little longer.",
  finish_gate_partly_out_of_frame: "Only part of the finish gate was in the shot, so the finish frame is less certain.",
  slow_launch: "The car rolled slowly off the gate before the cartridge fired properly. A rerun would be fairer.",
};

/** Who can be shown alongside a car. Only "car_only" is built so far. */
export type IdentityLevel = "car_only" | "first_name" | "full_name_photo";

export interface RaceSession {
  id: string;
  label: string;
  /** Race day, YYYY-MM-DD. */
  date: string;
  /** Class period, once the teacher sets it. */
  period: number | null;
  clipsRecorded: string;
}

export interface RaceCar {
  id: string;
  sessionId: string;
  label: string;
  /** The teacher has checked this car against its runs. Nothing is final until then. */
  confirmed: boolean;
  identityLevel: IdentityLevel;
  /** Teacher only: a photo clue to help confirm the match. Never sent to students. */
  hint: string;
}

export interface RaceRun {
  id: string;
  carId: string;
  sessionId: string;
  clip: string;
  startS: number;
  finishS: number;
  /** finish minus start, from the video. */
  elapsedMs: number;
  /** From the electronic finish gate, when one is entered. */
  gateMs: number | null;
  quality: Quality;
  note: string;
  rerun: boolean;
  /** Kept on record but left out of the standings. */
  excluded: boolean;
}

/**
 * A student and the car they raced. Teacher only: the first name reaches the
 * class pages only when showName is on, which the teacher sets once
 * permission is in. Never stored in the repo, only in the database.
 */
export interface RaceStudent {
  id: string;
  firstName: string;
  /** Teacher only: how the car looked in the photo, to help confirm the match. */
  carNote: string;
  carId: string | null;
  showName: boolean;
}

export interface RaceDay {
  eventName: string;
  eventDate: string;
  sessions: RaceSession[];
  cars: RaceCar[];
  runs: RaceRun[];
  students: RaceStudent[];
}

/** One frame of 30 fps video, the source of the ±0.05 s rule. */
export const VIDEO_FPS = 30;
/** Handoff rule: runs within 0.05 s of each other cannot be ranked from this footage. */
export const VIDEO_UNCERTAINTY_MS = 50;
/** An electronic gate reads to the thousandth of a second. */
export const GATE_UNCERTAINTY_MS = 1;

export function toMs(seconds: number): number {
  return Math.round(seconds * 1000);
}

export function elapsedMs(startS: number, finishS: number): number {
  return toMs(finishS) - toMs(startS);
}

export interface Timed {
  ms: number;
  source: "gate" | "video";
  uncertaintyMs: number;
}

/** A gate time beats a video time for the same run whenever there is one. */
export function officialTime(run: RaceRun): Timed {
  if (run.gateMs !== null) return { ms: run.gateMs, source: "gate", uncertaintyMs: GATE_UNCERTAINTY_MS };
  return { ms: run.elapsedMs, source: "video", uncertaintyMs: VIDEO_UNCERTAINTY_MS };
}

/** "0.93 s" for video, "0.931 s" for the gate: never more digits than the method earned. */
export function fmtTime(t: Timed): string {
  return `${(t.ms / 1000).toFixed(t.source === "gate" ? 3 : 2)} s`;
}

export function fmtUncertainty(t: Timed): string {
  return `±${(t.uncertaintyMs / 1000).toFixed(t.source === "gate" ? 3 : 2)} s`;
}

/** Two times cannot be told apart when they are within the larger of their uncertainties. */
export function tooClose(a: Timed, b: Timed): boolean {
  return Math.abs(a.ms - b.ms) <= Math.max(a.uncertaintyMs, b.uncertaintyMs);
}

function isClean(run: RaceRun): boolean {
  return run.quality !== "slow_launch";
}

/**
 * The run that counts for a car: its fastest run, preferring runs without a
 * slow launch so a bad launch never beats a good one by accident. Excluded
 * runs never count. Null when the car has nothing left to count.
 */
export function bestRun(runs: RaceRun[]): RaceRun | null {
  const live = runs.filter((r) => !r.excluded);
  const pool = live.some(isClean) ? live.filter(isClean) : live;
  let best: RaceRun | null = null;
  for (const r of pool) {
    if (!best || officialTime(r).ms < officialTime(best).ms) best = r;
  }
  return best;
}

export interface StandingRow {
  car: RaceCar;
  session: RaceSession | undefined;
  run: RaceRun;
  time: Timed;
  /** Every other run this car has, best first. */
  otherRuns: RaceRun[];
  /** Best and worst place this car could really hold. Equal when the place is certain. */
  placeFrom: number;
  placeTo: number;
  /** Cars this one cannot be separated from. */
  tiedWith: string[];
}

/**
 * Standings for a set of cars. Instead of pretending to a strict order, each
 * car gets the range of places it could really hold: its best place counts
 * only the cars that are clearly faster, its worst counts every car that is
 * not clearly slower.
 */
export function standings(day: Pick<RaceDay, "cars" | "runs" | "sessions">, sessionId?: string): StandingRow[] {
  const rows: Omit<StandingRow, "placeFrom" | "placeTo" | "tiedWith">[] = [];
  for (const car of day.cars) {
    if (sessionId && car.sessionId !== sessionId) continue;
    const runs = day.runs.filter((r) => r.carId === car.id);
    const run = bestRun(runs);
    if (!run) continue;
    const otherRuns = runs
      .filter((r) => r.id !== run.id)
      .sort((a, b) => officialTime(a).ms - officialTime(b).ms);
    rows.push({ car, session: day.sessions.find((s) => s.id === car.sessionId), run, time: officialTime(run), otherRuns });
  }
  rows.sort((a, b) => a.time.ms - b.time.ms || a.car.label.localeCompare(b.car.label));

  return rows.map((row) => {
    let clearlyFaster = 0;
    let notClearlySlower = 0;
    const tiedWith: string[] = [];
    for (const other of rows) {
      if (other === row) continue;
      if (tooClose(row.time, other.time)) {
        tiedWith.push(other.car.id);
        notClearlySlower++;
      } else if (other.time.ms < row.time.ms) {
        clearlyFaster++;
        notClearlySlower++;
      }
    }
    return { ...row, placeFrom: clearlyFaster + 1, placeTo: notClearlySlower + 1, tiedWith };
  });
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function fmtPlace(row: Pick<StandingRow, "placeFrom" | "placeTo">): string {
  return row.placeFrom === row.placeTo ? ordinal(row.placeFrom) : `${ordinal(row.placeFrom)} to ${ordinal(row.placeTo)}`;
}

export function sessionName(s: RaceSession | undefined): string {
  if (!s) return "Unknown session";
  return s.period ? `Period ${s.period}` : s.label;
}

/** What students may see: no teacher hints. */
export function forStudents(day: RaceDay): RaceDay {
  return {
    ...day,
    cars: day.cars.map((c) => ({ ...c, hint: "" })),
    // Only names with permission, only linked to a car, and nothing else about them.
    students: day.students
      .filter((s) => s.showName && s.carId)
      .map((s) => ({ id: s.id, firstName: s.firstName, carNote: "", carId: s.carId, showName: true })),
  };
}

/** First names cleared for the class, by car. */
export function namesByCar(day: Pick<RaceDay, "students">): Map<string, string> {
  const out = new Map<string, string>();
  for (const s of day.students) {
    if (!s.showName || !s.carId) continue;
    out.set(s.carId, out.has(s.carId) ? `${out.get(s.carId)} and ${s.firstName}` : s.firstName);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Input checks shared by the teacher routes
// ---------------------------------------------------------------------------

export function parseSeconds(raw: unknown, min: number, max: number): number | null {
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 1000) / 1000;
}

export function parseQuality(raw: unknown): Quality | null {
  return typeof raw === "string" && (QUALITIES as string[]).includes(raw) ? (raw as Quality) : null;
}

export function parsePeriod(raw: unknown): number | null | undefined {
  if (raw === null || raw === "") return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7 ? n : undefined;
}

/** Labels and notes are short plain text. Em dashes become commas, per the house style. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u2014\u2013]/g, ",").replace(/\s+/g, " ").trim().slice(0, max);
}

import { elapsedMs, type Quality, type RaceDay } from "./model";

/**
 * Race days, 2026-11-10 and 2026-11-11, as read frame by frame from 30 fps iPhone video.
 *
 * The leaderboard falls back to this when Supabase is not configured, and
 * supabase/migrations/0050_race_day.sql seeds the same rows. Cars only: no
 * student names, faces or clothing notes belong in this file or this repo,
 * including the first names the teacher confirmed for r24 to r27: those live
 * only in the database. Every other car starts unconfirmed.
 */

interface SeedRun {
  id: string;
  session: "A" | "B" | "C" | "D";
  clip: string;
  carLabel: string;
  startS: number;
  finishS: number;
  quality: Quality;
  note: string;
  /** The teacher has checked this car against the clip. */
  confirmed?: boolean;
}

const RUNS: SeedRun[] = [
  { id: "r01", session: "A", clip: "IMG_7797", carLabel: "Camo/brown", startS: 2.18, finishS: 3.27, quality: "finish_gate_out_of_frame", note: "Finish taken as car leaving bottom of frame. True time likely 0.03 to 0.05 s longer." },
  { id: "r02", session: "A", clip: "IMG_7797", carLabel: "Black", startS: 2.79, finishS: 3.98, quality: "finish_gate_out_of_frame", note: "Finish taken as car leaving bottom of frame. True time likely 0.03 to 0.05 s longer." },
  { id: "r03", session: "A", clip: "IMG_7798", carLabel: "Yellow", startS: 3.02, finishS: 4.35, quality: "ok", note: "" },
  { id: "r04", session: "A", clip: "IMG_7798", carLabel: "Orange", startS: 3.92, finishS: 5.25, quality: "ok", note: "" },
  { id: "r05", session: "A", clip: "IMG_7799", carLabel: "Pink", startS: 2.05, finishS: 3.15, quality: "ok", note: "" },
  { id: "r06", session: "A", clip: "IMG_7799", carLabel: "Green", startS: 10.57, finishS: 11.85, quality: "ok", note: "" },
  { id: "r07", session: "A", clip: "IMG_7801", carLabel: "Red", startS: 2.72, finishS: 3.68, quality: "ok", note: "" },
  { id: "r08", session: "A", clip: "IMG_7801", carLabel: "Dark green", startS: 3.15, finishS: 4.08, quality: "ok", note: "" },
  { id: "r09", session: "B", clip: "IMG_7803", carLabel: "Blue/white", startS: 3.79, finishS: 4.8, quality: "ok", note: "" },
  { id: "r10", session: "B", clip: "IMG_7806", carLabel: "Green/teal", startS: 2.78, finishS: 4.0, quality: "ok", note: "" },
  { id: "r11", session: "B", clip: "IMG_7806", carLabel: "Red", startS: 3.07, finishS: 5.35, quality: "slow_launch", note: "Car rolled slowly off the gate for about a second before accelerating. Candidate for a rerun." },
  { id: "r12", session: "B", clip: "IMG_7807", carLabel: "Lime green", startS: 3.63, finishS: 4.95, quality: "ok", note: "" },
  { id: "r13", session: "B", clip: "IMG_7807", carLabel: "Pink/white", startS: 4.05, finishS: 5.48, quality: "ok", note: "" },
  { id: "r14", session: "B", clip: "IMG_7808", carLabel: "Pink/magenta", startS: 3.77, finishS: 4.85, quality: "finish_gate_partly_out_of_frame", note: "" },
  { id: "r15", session: "B", clip: "IMG_7808", carLabel: "Blue/purple", startS: 16.3, finishS: 17.57, quality: "finish_gate_partly_out_of_frame", note: "" },
  { id: "r16", session: "B", clip: "IMG_7821", carLabel: "Magenta", startS: 13.25, finishS: 14.37, quality: "ok", note: "Start read from a small, distant view of the gate, so the start frame is less certain than usual. Possibly the magenta sculpted car in photo IMG_7813, unconfirmed." },
  { id: "r17", session: "B", clip: "IMG_7822", carLabel: "Pink", startS: 1.65, finishS: 2.65, quality: "ok", note: "Start read from a small, distant view of the gate, so the start frame is less certain than usual." },
  { id: "r18", session: "B", clip: "IMG_7822", carLabel: "Dark (black or dark maroon)", startS: 11.87, finishS: 12.84, quality: "ok", note: "Start read from a small, distant view of the gate, so the start frame is less certain than usual." },
  { id: "r19", session: "C", clip: "IMG_7824", carLabel: "Blue", startS: 3.2, finishS: 4.17, quality: "ok", note: "" },
  { id: "r20", session: "C", clip: "IMG_7824", carLabel: "Dark red", startS: 10.6, finishS: 11.5, quality: "ok", note: "" },
  { id: "r21", session: "C", clip: "IMG_7825", carLabel: "Olive/grey", startS: 6.05, finishS: 8.1, quality: "slow_launch", note: "Car crept off the gate for about a second before accelerating. Candidate for a rerun." },
  { id: "r22", session: "C", clip: "IMG_7825", carLabel: "Blue", startS: 13.24, finishS: 14.37, quality: "ok", note: "Camera pans during this run. May be the same blue car as r19, unconfirmed." },
  { id: "r23", session: "C", clip: "IMG_7833", carLabel: "Tan/black camo", startS: 5.73, finishS: 6.6, quality: "ok", note: "Fastest run of the day so far. Car overran the end of the track after the finish. Clip ends with a close-up of the car." },
  { id: "r24", session: "D", clip: "IMG_7837", carLabel: "Silver/white", startS: 3.93, finishS: 5.12, quality: "ok", note: "Head-to-head race with r25, both cars released together. Won by about 0.30 s. Start gate is distant in frame.", confirmed: true },
  { id: "r25", session: "D", clip: "IMG_7837", carLabel: "Grey with red and green", startS: 3.93, finishS: 5.42, quality: "ok", note: "Head-to-head race with r24, both cars released together. Start gate is distant in frame.", confirmed: true },
  { id: "r26", session: "D", clip: "IMG_7838", carLabel: "Black with natural wood top", startS: 17.37, finishS: 18.83, quality: "ok", note: "Head-to-head race with r27. Crossed the finish first, about 0.20 s ahead. Start gate is distant in frame.", confirmed: true },
  { id: "r27", session: "D", clip: "IMG_7838", carLabel: "Purple", startS: 17.52, finishS: 19.03, quality: "ok", note: "Head-to-head race with r26. Left the start gate about 0.15 s after the other car, so most of the finish gap came from the launch. Start gate is distant in frame.", confirmed: true },
];

/** Photo clues for the teacher's match screen. Car descriptions only. */
const HINTS: Record<string, string> = {
  r09: "Photos IMG_7812 and IMG_7817 show a blue rear, white front rail car. Medium confidence.",
  r11: "Photo IMG_7811 shows a red/orange body with a teal top stripe, also seen in clip IMG_7810. Low confidence.",
  r13: "Photo IMG_7818 shows an unpainted natural wood car that may read as pink/white on video. Low confidence.",
  r14: "Photo IMG_7813 shows a magenta, sculpted body car. Low confidence: r16 may be this car instead.",
  r15: "Photo IMG_7813 shows a blue body with a yellow tail. Low confidence.",
  r16: "May be the magenta sculpted car in photo IMG_7813. Unconfirmed.",
  r17: "Session B has four pink or magenta cars and four pink or magenta runs, so color alone cannot settle this one.",
  r22: "Camera pans during this run. May be the same blue car as r19.",
};

export const SEED: RaceDay = {
  eventName: "CO2 Dragster Race Day",
  eventDate: "2026-11-10",
  sessions: [
    { id: "A", label: "Nov 10 morning session", date: "2026-11-10", period: null, clipsRecorded: "09:31 to 09:40" },
    { id: "B", label: "Nov 10 late morning session", date: "2026-11-10", period: null, clipsRecorded: "11:02 to 12:02" },
    { id: "C", label: "Nov 10 afternoon session", date: "2026-11-10", period: null, clipsRecorded: "14:15 to 14:45" },
    { id: "D", label: "Nov 11 morning session", date: "2026-11-11", period: null, clipsRecorded: "08:11 to 08:22" },
  ],
  cars: RUNS.map((r) => ({
    id: `c${r.id.slice(1)}`,
    sessionId: r.session,
    label: r.carLabel,
    confirmed: r.confirmed === true,
    identityLevel: "car_only" as const,
    hint: HINTS[r.id] ?? "",
  })),
  runs: RUNS.map((r) => ({
    id: r.id,
    carId: `c${r.id.slice(1)}`,
    sessionId: r.session,
    clip: r.clip,
    startS: r.startS,
    finishS: r.finishS,
    elapsedMs: elapsedMs(r.startS, r.finishS),
    gateMs: null,
    quality: r.quality,
    note: r.note,
    rerun: false,
    excluded: false,
    stage: "prelim" as const,
  })),
  // Names live only in the database. See supabase/migrations/0051_race_day_students.sql.
  students: [],
};

import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import { SEED } from "./race-day/seed";
import { toMs, type IdentityLevel, type Quality, type RaceDay } from "./race-day/model";

/**
 * Storage for Race Day. See supabase/migrations/0050_race_day.sql.
 *
 * Service role only, behind the class password in every route. Reads fall
 * back to the seed in src/lib/race-day/seed.ts when Supabase is not
 * configured, so the leaderboard still works on a preview with no database;
 * the teacher screen says it cannot save until the database is connected.
 */

export interface Loaded {
  day: RaceDay;
  source: "db" | "seed";
}

type Num = number | string;

export async function loadRaceDay(): Promise<Loaded> {
  const db = getSupabaseServiceClient();
  if (!db) return { day: SEED, source: "seed" };

  const [s, c, r] = await Promise.all([
    db.from("race_day_sessions").select("id, label, period, clips_recorded").order("id"),
    db.from("race_day_cars").select("id, session_id, label, confirmed, identity_level, match_hint").order("id"),
    db
      .from("race_day_runs")
      .select("id, car_id, session_id, clip, start_s, finish_s, elapsed_s, gate_time_s, quality, note, rerun, excluded")
      .order("created_at")
      .order("id"),
  ]);
  if (s.error || c.error || r.error) {
    console.error("[race-day] read failed", s.error?.message ?? c.error?.message ?? r.error?.message);
    return { day: SEED, source: "seed" };
  }
  if (!s.data.length) return { day: SEED, source: "seed" };

  return {
    source: "db",
    day: {
      eventName: SEED.eventName,
      eventDate: SEED.eventDate,
      sessions: (s.data as Array<{ id: string; label: string; period: number | null; clips_recorded: string }>).map((x) => ({
        id: x.id,
        label: x.label,
        period: x.period,
        clipsRecorded: x.clips_recorded,
      })),
      cars: (
        c.data as Array<{ id: string; session_id: string; label: string; confirmed: boolean; identity_level: IdentityLevel; match_hint: string }>
      ).map((x) => ({
        id: x.id,
        sessionId: x.session_id,
        label: x.label,
        confirmed: x.confirmed,
        identityLevel: x.identity_level,
        hint: x.match_hint ?? "",
      })),
      runs: (
        r.data as Array<{
          id: string;
          car_id: string;
          session_id: string;
          clip: string;
          start_s: Num;
          finish_s: Num;
          elapsed_s: Num;
          gate_time_s: Num | null;
          quality: Quality;
          note: string;
          rerun: boolean;
          excluded: boolean;
        }>
      ).map((x) => ({
        id: x.id,
        carId: x.car_id,
        sessionId: x.session_id,
        clip: x.clip,
        startS: Number(x.start_s),
        finishS: Number(x.finish_s),
        elapsedMs: toMs(Number(x.elapsed_s)),
        gateMs: x.gate_time_s === null ? null : toMs(Number(x.gate_time_s)),
        quality: x.quality,
        note: x.note ?? "",
        rerun: x.rerun,
        excluded: x.excluded,
      })),
    },
  };
}

export type Saved = { ok: true } | { ok: false; error: string };

const OFFLINE: Saved = { ok: false, error: "The database is not connected, so changes cannot be saved yet." };

function done(error: { message: string } | null, what: string): Saved {
  if (!error) return { ok: true };
  console.error(`[race-day] ${what} failed`, error.message);
  return { ok: false, error: `Could not save the ${what}.` };
}

export async function updateSession(id: string, patch: { period: number | null }): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return OFFLINE;
  const { error } = await db.from("race_day_sessions").update({ period: patch.period }).eq("id", id);
  return done(error, "session");
}

export async function updateCar(id: string, patch: { label?: string; confirmed?: boolean }): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return OFFLINE;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.confirmed !== undefined) row.confirmed = patch.confirmed;
  const { error } = await db.from("race_day_cars").update(row).eq("id", id);
  return done(error, "car");
}

export async function updateRun(
  id: string,
  patch: { carId?: string; gateS?: number | null; quality?: Quality; note?: string; rerun?: boolean; excluded?: boolean },
): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return OFFLINE;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.carId !== undefined) {
    const { data: car } = await db.from("race_day_cars").select("session_id").eq("id", patch.carId).maybeSingle();
    if (!car) return { ok: false, error: "That car does not exist." };
    row.car_id = patch.carId;
    row.session_id = car.session_id;
  }
  if (patch.gateS !== undefined) row.gate_time_s = patch.gateS;
  if (patch.quality !== undefined) row.quality = patch.quality;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.rerun !== undefined) row.rerun = patch.rerun;
  if (patch.excluded !== undefined) row.excluded = patch.excluded;
  const { error } = await db.from("race_day_runs").update(row).eq("id", id);
  return done(error, "run");
}

export async function addRun(input: {
  sessionId: string;
  carId: string | null;
  newCarLabel: string;
  clip: string;
  startS: number;
  finishS: number;
  quality: Quality;
  note: string;
  rerun: boolean;
}): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return OFFLINE;

  let carId = input.carId;
  if (carId) {
    const { data: car } = await db.from("race_day_cars").select("session_id").eq("id", carId).maybeSingle();
    if (!car) return { ok: false, error: "That car does not exist." };
    if (car.session_id !== input.sessionId) return { ok: false, error: "That car belongs to the other session." };
  } else {
    const made = await db
      .from("race_day_cars")
      .insert({ session_id: input.sessionId, label: input.newCarLabel })
      .select("id")
      .single();
    if (made.error) return done(made.error, "new car");
    carId = made.data.id as string;
  }

  const { error } = await db.from("race_day_runs").insert({
    car_id: carId,
    session_id: input.sessionId,
    clip: input.clip,
    start_s: input.startS,
    finish_s: input.finishS,
    elapsed_s: (Math.round(input.finishS * 1000) - Math.round(input.startS * 1000)) / 1000,
    quality: input.quality,
    note: input.note,
    rerun: input.rerun,
  });
  return done(error, "run");
}

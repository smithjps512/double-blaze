import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import type { CarSpec } from "./dragster/sim";

/**
 * Storage for the Dragster Lab board. See
 * supabase/migrations/0043_dragster_lab.sql.
 *
 * Service role only. Every function tolerates Supabase being unconfigured and
 * says so rather than throwing, so the Lab still races cars on a preview with
 * no database; only the shared board goes quiet.
 */

export type RunKind = "twin" | "mod";

export interface BoardEntry {
  initials: string;
  timeMs: number;
  car: CarSpec;
  mine: boolean;
}

export const BOARD_SIZE = 16;

export async function dragsterBoard(period: number, kind: RunKind, playerKey: string | null): Promise<BoardEntry[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("dragster_runs")
    .select("initials, time_ms, car, player_key, created_at")
    .eq("period", period)
    .eq("kind", kind)
    .order("time_ms", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(BOARD_SIZE);
  if (error) {
    console.error("[dragster] board read failed", error.message);
    return null;
  }
  return (data as Array<{ initials: string; time_ms: number; car: CarSpec; player_key: string }>).map((r) => ({
    initials: r.initials,
    timeMs: r.time_ms,
    car: r.car,
    mine: !!playerKey && r.player_key === playerKey,
  }));
}

/** Keeps each device's best run per period and stage. Returns whether it was a new best. */
export async function postRun(input: {
  period: number;
  kind: RunKind;
  initials: string;
  timeMs: number;
  car: CarSpec;
  playerKey: string;
}): Promise<{ ok: true; best: boolean } | { ok: false; error: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "The class board is not switched on yet." };

  const { data: existing } = await db
    .from("dragster_runs")
    .select("id, time_ms")
    .eq("period", input.period)
    .eq("kind", input.kind)
    .eq("player_key", input.playerKey)
    .maybeSingle();

  if (existing && (existing.time_ms as number) <= input.timeMs) {
    await db.from("dragster_runs").update({ initials: input.initials }).eq("id", existing.id);
    return { ok: true, best: false };
  }

  const row = {
    period: input.period,
    kind: input.kind,
    initials: input.initials,
    time_ms: input.timeMs,
    car: input.car,
    player_key: input.playerKey,
    created_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await db.from("dragster_runs").update(row).eq("id", existing.id)
    : await db.from("dragster_runs").insert(row);
  if (error) {
    console.error("[dragster] run write failed", error.message);
    return { ok: false, error: "Could not save your run." };
  }
  return { ok: true, best: true };
}

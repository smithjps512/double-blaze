import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import { cleanPlan, type LaunchPlan } from "./launch/plan";

/**
 * Storage for Launch Pad plans. See supabase/migrations/0045_launch_pad.sql.
 *
 * Service role only. Every function tolerates Supabase being unconfigured and
 * returns null rather than throwing, so the page still works on a preview with
 * no database: the plan lives on the Chromebook and the page says so.
 */

export interface StoredPlan {
  teamName: string;
  plan: LaunchPlan;
  rev: number;
  updatedAt: string;
}

export async function getPlan(period: number, key: string): Promise<StoredPlan | null | "off"> {
  const db = getSupabaseServiceClient();
  if (!db) return "off";
  const { data, error } = await db
    .from("launch_plans")
    .select("team_name, plan, rev, updated_at")
    .eq("period", period)
    .eq("team_key", key)
    .maybeSingle();
  if (error) {
    console.error("[launch] read failed", error.message);
    return "off";
  }
  if (!data) return null;
  return { teamName: data.team_name, plan: cleanPlan(data.plan), rev: data.rev, updatedAt: data.updated_at };
}

/** Team names in a period, for the "is this your team?" list. Names only. */
export async function listTeams(period: number): Promise<string[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("launch_plans")
    .select("team_name")
    .eq("period", period)
    .order("team_name", { ascending: true });
  if (error) {
    console.error("[launch] list failed", error.message);
    return null;
  }
  return (data as Array<{ team_name: string }>).map((r) => r.team_name);
}

export type SaveResult =
  | { ok: true; rev: number }
  | { ok: false; conflict: StoredPlan }
  | { ok: false; error: string };

/**
 * Saves a plan if nobody has saved since `rev`. A rev of 0 creates the team.
 *
 * The update is conditional on the rev in the same statement, so two
 * Chromebooks pressing save at the same moment cannot both win.
 */
export async function savePlan(input: {
  period: number;
  key: string;
  teamName: string;
  plan: LaunchPlan;
  rev: number;
}): Promise<SaveResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "Saving to the class is not switched on here." };
  const now = new Date().toISOString();

  if (input.rev === 0) {
    const { error } = await db.from("launch_plans").insert({
      period: input.period,
      team_key: input.key,
      team_name: input.teamName,
      plan: input.plan,
      rev: 1,
      updated_at: now,
    });
    if (!error) return { ok: true, rev: 1 };
    if (error.code !== "23505") {
      console.error("[launch] create failed", error.message);
      return { ok: false, error: "Could not save. Try again." };
    }
    // Somebody made this team first: fall through to the conflict below.
  } else {
    const { data, error } = await db
      .from("launch_plans")
      .update({ plan: input.plan, rev: input.rev + 1, updated_at: now })
      .eq("period", input.period)
      .eq("team_key", input.key)
      .eq("rev", input.rev)
      .select("rev");
    if (error) {
      console.error("[launch] save failed", error.message);
      return { ok: false, error: "Could not save. Try again." };
    }
    if (data && data.length === 1) return { ok: true, rev: data[0].rev as number };
  }

  const current = await getPlan(input.period, input.key);
  if (current && current !== "off") return { ok: false, conflict: current };
  return { ok: false, error: "Could not save. Try again." };
}

/** Every team in every period, for the export script. */
export async function allPlans(): Promise<Array<StoredPlan & { period: number; key: string }> | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("launch_plans")
    .select("period, team_key, team_name, plan, rev, updated_at")
    .order("period", { ascending: true })
    .order("team_key", { ascending: true });
  if (error) {
    console.error("[launch] export read failed", error.message);
    return null;
  }
  return (data as Array<{ period: number; team_key: string; team_name: string; plan: unknown; rev: number; updated_at: string }>).map((r) => ({
    period: r.period,
    key: r.team_key,
    teamName: r.team_name,
    plan: cleanPlan(r.plan),
    rev: r.rev,
    updatedAt: r.updated_at,
  }));
}

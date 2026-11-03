import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import { cleanDesign, cleanSpec, type ExpressDesign, type GameSpec } from "./express/spec";
import { schoolMidnight } from "./express/day";

/**
 * Storage for Studio Express games. See supabase/migrations/0049_express_games.sql.
 * Service role only; every function returns null when Supabase is not set up.
 */

export const BUILDS_PER_DAY = 3;

/** Midnight in Virginia, as an ISO time: "today" is the school's today, in EST or EDT. */
export function startOfSchoolDay(now = new Date()): string {
  return schoolMidnight(now).toISOString();
}

const newSlug = () => Array.from(randomBytes(8), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");

export async function buildsToday(deviceKey: string): Promise<number | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { count, error } = await db.from("express_games").select("id", { count: "exact", head: true }).eq("device_key", deviceKey).gte("created_at", startOfSchoolDay());
  if (error) {
    console.error("[express] count failed", error.message);
    return null;
  }
  return count ?? 0;
}

export async function saveGame(input: { design: ExpressDesign; spec: GameSpec; deviceKey: string }): Promise<string | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const slug = newSlug();
  const { error } = await db.from("express_games").insert({
    slug,
    period: input.design.period,
    initials: input.design.initials,
    studio: input.design.studio,
    device_key: input.deviceKey,
    design: input.design,
    spec: input.spec,
    built_by: input.spec.builtBy,
  });
  if (error) {
    console.error("[express] save failed", error.message);
    return null;
  }
  return slug;
}

export async function getGame(slug: string): Promise<{ spec: GameSpec; design: ExpressDesign; createdAt: string } | null> {
  const db = getSupabaseServiceClient();
  if (!db || !/^[a-z0-9]{8}$/.test(slug)) return null;
  const { data } = await db.from("express_games").select("design, spec, created_at").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const design = cleanDesign(data.design);
  return { design, spec: cleanSpec(data.spec, design), createdAt: data.created_at };
}

export interface TodayGame {
  slug: string;
  initials: string;
  studio: string;
  title: string;
  genre: string;
  heroEmoji: string;
  builtBy: string;
  builds: number;
  createdAt: string;
}

/** Each Chromebook's latest game today in a period, with how many times it built. */
export async function gamesToday(period: number): Promise<TodayGame[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("express_games")
    .select("slug, initials, studio, device_key, spec, built_by, created_at")
    .eq("period", period)
    .gte("created_at", startOfSchoolDay())
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[express] today failed", error.message);
    return null;
  }
  const seen = new Map<string, TodayGame>();
  for (const r of data as Array<{ slug: string; initials: string; studio: string; device_key: string; spec: { title?: string; genre?: string; hero?: { emoji?: string } }; built_by: string; created_at: string }>) {
    const prev = seen.get(r.device_key);
    if (prev) {
      prev.builds++;
      continue;
    }
    seen.set(r.device_key, {
      slug: r.slug,
      initials: r.initials,
      studio: r.studio,
      title: String(r.spec?.title ?? "Untitled").slice(0, 50),
      genre: String(r.spec?.genre ?? ""),
      heroEmoji: String(r.spec?.hero?.emoji ?? "🎮").slice(0, 8),
      builtBy: r.built_by,
      builds: 1,
      createdAt: r.created_at,
    });
  }
  return [...seen.values()].sort((a, b) => a.initials.localeCompare(b.initials));
}

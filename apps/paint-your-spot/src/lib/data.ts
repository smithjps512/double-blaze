import "server-only";
import { getSessionClient } from "./supabase";
import { defaultSettings, mergeSettings, type Settings } from "./settings";

export async function loadSettings(): Promise<Settings> {
  const base = defaultSettings(process.env);
  const db = await getSessionClient();
  if (!db) return base;
  const { data, error } = await db.from("pys_settings").select("key, value");
  if (error) {
    console.error("[paint-your-spot] settings read failed:", error.message);
    return base;
  }
  return mergeSettings(base, data);
}

export interface InterestCounts {
  in: number;
  probably: number;
}

/** I'm in and Probably, counted separately. Null when the database is unreachable. */
export async function loadInterestCounts(): Promise<InterestCounts | null> {
  const db = await getSessionClient();
  if (!db) return null;
  const { data, error } = await db.rpc("pys_interest_counts");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    if (error) console.error("[paint-your-spot] interest counts failed:", error.message);
    return null;
  }
  return { in: Number(row.in_count) || 0, probably: Number(row.probably_count) || 0 };
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://paintyourspot.doubleblaze.solutions").replace(/\/$/, "");
}

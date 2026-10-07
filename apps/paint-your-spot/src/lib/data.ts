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

/** Staff who said I'm in or Probably. Null when the database is unreachable. */
export async function loadInterestCount(): Promise<number | null> {
  const db = await getSessionClient();
  if (!db) return null;
  const { data, error } = await db.rpc("pys_interest_count");
  if (error) {
    console.error("[paint-your-spot] interest count failed:", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://paintyourspot.doubleblaze.solutions").replace(/\/$/, "");
}

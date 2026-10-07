import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResponseRow } from "./survey";
import { getViewer, syncProfile, type Viewer } from "./viewer";

/**
 * The admin gate. Config says who is an admin; the profile sync makes RLS
 * agree before any rows are read.
 */
export async function requireAdmin(): Promise<{ viewer: Viewer; db: SupabaseClient } | null> {
  const { viewer, db } = await getViewer();
  if (!viewer?.isAdmin || !db) return null;
  await syncProfile(viewer);
  return { viewer, db };
}

export async function loadResponses(db: SupabaseClient): Promise<{ rows: ResponseRow[]; error: string | null }> {
  const { data, error } = await db
    .from("pys_interest_responses")
    .select(
      "user_id, email, name, role, interest_level, interests, preferred_lot, painter, keep_yearly, price_comfort, comments, created_at, updated_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[paint-your-spot] responses read failed:", error.message);
    return { rows: [], error: error.message };
  }
  return { rows: (data ?? []) as ResponseRow[], error: null };
}

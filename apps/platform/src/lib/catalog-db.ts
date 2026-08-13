import "server-only";
import { getSupabaseServiceClient } from "./supabase";

/** A row of the `catalog` table (spec section 3, migration 0002). */
export interface CatalogRow {
  id: string;
  catalog_key: string;
  name: string;
  description: string | null;
  type: "plan" | "alacarte";
  billing: "recurring" | "one_time";
  unit_amount: number; // cents
  currency: string;
  interval: string | null;
  min_term_months: number | null;
  requires_maintenance: boolean;
  maintenance_key: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  active: boolean;
}

/**
 * Reads offerings from the catalog table. Returns null when Supabase is not
 * configured so callers can render a graceful "checkout unavailable" state
 * instead of throwing. Offerings are never hardcoded; price ids come from here.
 */
export async function getOfferingByKey(
  key: string,
): Promise<CatalogRow | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("catalog")
    .select("*")
    .eq("catalog_key", key)
    .eq("active", true)
    .maybeSingle();
  if (error) {
    console.error("[catalog] lookup failed:", error.message);
    return null;
  }
  return (data as CatalogRow | null) ?? null;
}

export async function getActiveOfferings(): Promise<CatalogRow[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("catalog")
    .select("*")
    .eq("active", true);
  if (error) {
    console.error("[catalog] list failed:", error.message);
    return [];
  }
  return (data as CatalogRow[]) ?? [];
}

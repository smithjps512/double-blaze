import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server only, service role. bmsb_signups has RLS on and no policies, so the
 * browser can never read or write it directly: every sign up and every admin
 * read goes through this app's server code.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const TABLE = "bmsb_signups";

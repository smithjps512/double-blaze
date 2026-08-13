import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase clients (spec section 2). RLS is enforced in the database (see
 * supabase/migrations). The anon client is for browser/public reads; the
 * service-role client is server-only and bypasses RLS for trusted operations.
 *
 * Both return null when env is not configured so the storefront can build and
 * run without a Supabase project attached.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAnonClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

/** Server-only. Never import into client components. */
export function getSupabaseServiceClient(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

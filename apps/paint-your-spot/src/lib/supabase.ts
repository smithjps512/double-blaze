import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Two clients, same rule as the members app:
 *
 *  - `getSessionClient` runs as the signed in user, under RLS. Use it for
 *    everything a user or admin does.
 *  - `getServiceClient` bypasses RLS. Used only to write pys_profiles, which
 *    no user may write for themselves.
 */

function env() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function isConfigured(): boolean {
  const { url, anonKey } = env();
  return Boolean(url && anonKey);
}

export async function getSessionClient(): Promise<SupabaseClient | null> {
  const { url, anonKey } = env();
  if (!url || !anonKey) return null;
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. Middleware refreshes them.
        }
      },
    },
  });
}

export function getServiceClient(): SupabaseClient | null {
  const { url, serviceKey } = env();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

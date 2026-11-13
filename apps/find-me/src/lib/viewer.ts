import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { inList, parseEmailList } from "./auth-rules";
import { getServiceClient, getSessionClient } from "./supabase";

export interface Viewer {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  /** Shelters this person is staff at. Empty for adopters. */
  shelterIds: string[];
}

function adminEmails(): string[] {
  return parseEmailList(process.env.FM_ADMIN_EMAILS);
}

function displayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name = meta.full_name ?? meta.name ?? "";
  return typeof name === "string" && name.trim() ? name.trim() : (user.email ?? "").split("@")[0];
}

/** The signed in person, or null. */
export async function getViewer(): Promise<{ viewer: Viewer | null; db: SupabaseClient | null }> {
  const db = await getSessionClient();
  if (!db) return { viewer: null, db: null };
  const { data } = await db.auth.getUser();
  const user = data.user;
  if (!user?.email) return { viewer: null, db };
  const { data: staff } = await db.from("fm_staff").select("shelter_id").eq("user_id", user.id);
  return {
    viewer: {
      id: user.id,
      email: user.email.toLowerCase(),
      name: displayName(user),
      isAdmin: inList(adminEmails(), user.email),
      shelterIds: ((staff ?? []) as { shelter_id: string }[]).map((s) => s.shelter_id),
    },
    db,
  };
}

/**
 * Copies the admin flag from config onto fm_profiles so RLS can see it. Runs
 * at sign in, so a config change takes effect on the next sign in. Nobody can
 * write their own profile.
 */
export async function syncProfile(user: User): Promise<void> {
  const service = getServiceClient();
  if (!service || !user.email) return;
  const { error } = await service.from("fm_profiles").upsert(
    {
      id: user.id,
      email: user.email.toLowerCase(),
      name: displayName(user),
      is_admin: inList(adminEmails(), user.email),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) console.error("[find-me] profile sync failed:", error.message);
}

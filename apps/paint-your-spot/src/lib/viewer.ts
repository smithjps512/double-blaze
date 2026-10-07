import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServiceClient, getSessionClient } from "./supabase";
import { inList, isStaffEmail, parseEmailList } from "./auth-rules";

export interface Viewer {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isBoss: boolean;
}

export function adminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function bossEmails(): string[] {
  return parseEmailList(process.env.BOSS_EMAILS);
}

function googleName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name = meta.full_name ?? meta.name ?? "";
  return typeof name === "string" ? name.trim() : "";
}

/**
 * The signed in staff member, or null. Anyone signed in outside @mcps.org
 * counts as signed out: the callback already refuses them, and this is the
 * second lock on the same door.
 */
export async function getViewer(): Promise<{ viewer: Viewer | null; db: SupabaseClient | null }> {
  const db = await getSessionClient();
  if (!db) return { viewer: null, db: null };
  const { data } = await db.auth.getUser();
  return { viewer: viewerFromUser(data.user), db };
}

export function viewerFromUser(user: User | null): Viewer | null {
  if (!user?.email || !isStaffEmail(user.email)) return null;
  return {
    id: user.id,
    email: user.email.toLowerCase(),
    name: googleName(user),
    isAdmin: inList(adminEmails(), user.email),
    isBoss: inList(bossEmails(), user.email),
  };
}

/**
 * Copies config roles onto pys_profiles so RLS can see them. Runs at sign in,
 * and again when an admin opens /admin, so a config change takes effect
 * without everyone signing out.
 */
export async function syncProfile(viewer: Viewer): Promise<boolean> {
  const service = getServiceClient();
  if (!service) return false;
  const { error } = await service.from("pys_profiles").upsert(
    {
      id: viewer.id,
      email: viewer.email,
      name: viewer.name || null,
      is_admin: viewer.isAdmin,
      is_boss: viewer.isBoss,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) console.error("[paint-your-spot] profile sync failed:", error.message);
  return !error;
}

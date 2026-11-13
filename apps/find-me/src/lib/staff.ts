import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_SHELTERS } from "./demo-data";
import { getShelter, isDemo, listShelters } from "./data";
import type { Shelter } from "./types";
import { getViewer, type Viewer } from "./viewer";

export type StaffContext =
  | { kind: "demo"; shelter: Shelter; shelters: Shelter[] }
  | { kind: "staff"; viewer: Viewer; db: SupabaseClient; shelter: Shelter; shelters: Shelter[] }
  | { kind: "signed-out" }
  | { kind: "not-staff"; viewer: Viewer };

/**
 * Who is using the shelter tool, and for which shelter. Staff at more than one
 * shelter (and Double Blaze admins) pick with ?shelter=<id>. In demo mode the
 * tool opens read-only on the first sample shelter so it can be shown to a
 * prospective partner. The database enforces all of this again with RLS.
 */
export async function staffContext(requested?: string): Promise<StaffContext> {
  if (isDemo()) {
    const shelter = DEMO_SHELTERS.find((s) => s.id === requested) ?? DEMO_SHELTERS[0];
    return { kind: "demo", shelter, shelters: DEMO_SHELTERS };
  }
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { kind: "signed-out" };
  const all = await listShelters();
  const shelters = viewer.isAdmin ? all : all.filter((s) => viewer.shelterIds.includes(s.id));
  if (shelters.length === 0) return { kind: "not-staff", viewer };
  const shelter = shelters.find((s) => s.id === requested) ?? shelters[0];
  return { kind: "staff", viewer, db, shelter, shelters };
}

/** For actions: the session client, if the viewer may act for this shelter. */
export async function staffFor(shelterId: string): Promise<{ viewer: Viewer; db: SupabaseClient; shelter: Shelter } | null> {
  if (isDemo()) return null;
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return null;
  if (!viewer.isAdmin && !viewer.shelterIds.includes(shelterId)) return null;
  const shelter = await getShelter({ id: shelterId });
  return shelter ? { viewer, db, shelter } : null;
}

import "server-only";
import { DEMO_ANIMALS, DEMO_SHELTERS } from "./demo-data";
import { animalFromRow, shelterFromRow, type AnimalRow, type ShelterRow } from "./rows";
import { getSessionClient, isConfigured } from "./supabase";
import type { Animal, Shelter, Species } from "./types";

/**
 * Read access for pages. With Supabase configured, everything comes from the
 * database under the visitor's own RLS. Without it, the app runs in demo
 * mode on invented sample data, and every page says so.
 */

export function isDemo(): boolean {
  return !isConfigured();
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004").replace(/\/$/, "");
}

export async function listShelters(): Promise<Shelter[]> {
  const db = await getSessionClient();
  if (!db) return DEMO_SHELTERS;
  const { data, error } = await db.from("fm_shelters").select("*").eq("active", true).order("name");
  if (error) console.error("[find-me] shelters:", error.message);
  return ((data ?? []) as ShelterRow[]).map(shelterFromRow);
}

export async function getShelter(by: { id?: string; slug?: string; code?: string }): Promise<Shelter | null> {
  const db = await getSessionClient();
  if (!db) {
    return (
      DEMO_SHELTERS.find(
        (s) => s.id === by.id || s.slug === by.slug || (by.code && s.adoptionCode === by.code.toUpperCase()),
      ) ?? null
    );
  }
  let q = db.from("fm_shelters").select("*");
  if (by.id) q = q.eq("id", by.id);
  else if (by.slug) q = q.eq("slug", by.slug);
  else if (by.code) q = q.eq("adoption_code", by.code.toUpperCase());
  else return null;
  const { data } = await q.maybeSingle();
  return data ? shelterFromRow(data as ShelterRow) : null;
}

export interface AnimalFilter {
  species?: Species;
  shelterId?: string;
  /** Include on-hold animals (shown, but marked). */
  includeOnHold?: boolean;
}

/** The public listing: available (and optionally on-hold) animals. */
export async function listAnimals(filter: AnimalFilter = {}): Promise<Animal[]> {
  const statuses = filter.includeOnHold ? ["available", "on_hold"] : ["available"];
  const db = await getSessionClient();
  if (!db) {
    return DEMO_ANIMALS.filter(
      (a) =>
        statuses.includes(a.status) &&
        (!filter.species || a.species === filter.species) &&
        (!filter.shelterId || a.shelterId === filter.shelterId),
    );
  }
  let q = db.from("fm_animals").select("*").in("status", statuses).order("intake_date");
  if (filter.species) q = q.eq("species", filter.species);
  if (filter.shelterId) q = q.eq("shelter_id", filter.shelterId);
  const { data, error } = await q;
  if (error) console.error("[find-me] animals:", error.message);
  return ((data ?? []) as AnimalRow[]).map(animalFromRow);
}

export async function getAnimal(id: string): Promise<Animal | null> {
  const db = await getSessionClient();
  if (!db) return DEMO_ANIMALS.find((a) => a.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("fm_animals").select("*").eq("id", id).maybeSingle();
  return data ? animalFromRow(data as AnimalRow) : null;
}

/** Every animal at one shelter, any status. Staff only (RLS enforces it). */
export async function listShelterAnimals(shelterId: string): Promise<Animal[]> {
  const db = await getSessionClient();
  if (!db) return DEMO_ANIMALS.filter((a) => a.shelterId === shelterId);
  const { data } = await db
    .from("fm_animals")
    .select("*")
    .eq("shelter_id", shelterId)
    .order("status")
    .order("name");
  return ((data ?? []) as AnimalRow[]).map(animalFromRow);
}

export interface ClaimableAnimal {
  id: string;
  shelterId: string;
  name: string;
  species: Species;
  ageGroup: Animal["ageGroup"];
  breed: string;
  photoUrl: string | null;
}

/** What a new owner can pick after scanning a shelter's QR code. */
export async function listClaimable(code: string): Promise<ClaimableAnimal[]> {
  const db = await getSessionClient();
  if (!db) {
    const shelter = DEMO_SHELTERS.find((s) => s.adoptionCode === code.toUpperCase());
    return DEMO_ANIMALS.filter((a) => a.shelterId === shelter?.id).map((a) => ({
      id: a.id,
      shelterId: a.shelterId,
      name: a.name,
      species: a.species,
      ageGroup: a.ageGroup,
      breed: a.breed,
      photoUrl: a.photoUrl,
    }));
  }
  const { data, error } = await db.rpc("fm_claimable_animals", { code });
  if (error) console.error("[find-me] claimable:", error.message);
  return ((data ?? []) as { id: string; shelter_id: string; name: string; species: Species; age_group: Animal["ageGroup"]; breed: string; photo_url: string | null }[]).map(
    (r) => ({
      id: r.id,
      shelterId: r.shelter_id,
      name: r.name,
      species: r.species,
      ageGroup: r.age_group,
      breed: r.breed,
      photoUrl: r.photo_url,
    }),
  );
}

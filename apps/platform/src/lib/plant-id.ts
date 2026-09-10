import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Name That Plant: the data behind the classroom page where third period puts
 * names on the greenhouse photos nobody labelled.
 *
 * Anonymous by design, the same rule the Trail Crew helper follows. There are
 * no accounts and no student identity. A voter is a random token the browser
 * generates and keeps to itself, which exists so one device can change its own
 * vote and cannot vote twice, and for no other purpose.
 *
 * Everything here runs on the server with the service role key. The tables have
 * RLS on with no policies, so the browser can never reach them directly.
 */

export const MAX_NAME_LENGTH = 90;

export interface PlantName {
  id: string;
  name: string;
  votes: number;
  /** True when this device's vote is on this name. */
  mine: boolean;
}

export interface Specimen {
  id: string;
  fileName: string;
  kind: "unknown" | "needs_photo";
  species: string | null;
  commonName: string | null;
  photoSource: string | null;
  imagePath: string | null;
  settledName: string | null;
  sortOrder: number;
  names: PlantName[];
}

interface SpecimenRow {
  id: string;
  file_name: string;
  kind: "unknown" | "needs_photo";
  species: string | null;
  common_name: string | null;
  photo_source: string | null;
  image_path: string | null;
  settled_name: string | null;
  sort_order: number;
}

interface NameRow {
  id: string;
  specimen_id: string;
  name: string;
}

interface VoteRow {
  name_id: string;
  voter_key: string;
}

/**
 * Everything the page renders, in one round trip per table. Three small reads
 * beat a join here: the whole data set is a couple of dozen rows and a class
 * worth of votes, and the shape stays obvious.
 */
export async function loadSpecimens(voterKey: string): Promise<Specimen[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];

  const [specimens, names, votes] = await Promise.all([
    db.from("plant_id_specimens").select("*").order("sort_order"),
    db.from("plant_id_names").select("id, specimen_id, name"),
    db.from("plant_id_votes").select("name_id, voter_key"),
  ]);

  if (specimens.error || !specimens.data) return [];

  const nameRows = (names.data ?? []) as NameRow[];
  const voteRows = (votes.data ?? []) as VoteRow[];

  const tally = new Map<string, number>();
  const mine = new Set<string>();
  for (const vote of voteRows) {
    tally.set(vote.name_id, (tally.get(vote.name_id) ?? 0) + 1);
    if (voterKey && vote.voter_key === voterKey) mine.add(vote.name_id);
  }

  return (specimens.data as SpecimenRow[]).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    kind: row.kind,
    species: row.species,
    commonName: row.common_name,
    photoSource: row.photo_source,
    imagePath: row.image_path,
    settledName: row.settled_name,
    sortOrder: row.sort_order,
    names: nameRows
      .filter((n) => n.specimen_id === row.id)
      .map((n) => ({
        id: n.id,
        name: n.name,
        votes: tally.get(n.id) ?? 0,
        mine: mine.has(n.id),
      }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name)),
  }));
}

export type AddNameResult =
  | { ok: true; nameId: string }
  | { ok: false; error: string };

/**
 * Adds a name, or returns the existing one when someone has already put up the
 * same answer. Two students typing "black eyed susan" should land on one slip
 * they can both vote for, not two that split the vote.
 */
export async function addName(specimenId: string, raw: string): Promise<AddNameResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "The class list is not switched on yet. Ask your teacher." };

  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Type a name first." };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_NAME_LENGTH} characters.` };
  }

  const specimen = await db
    .from("plant_id_specimens")
    .select("id, settled_name")
    .eq("id", specimenId)
    .maybeSingle();
  if (specimen.error || !specimen.data) return { ok: false, error: "That plant is not on the list." };
  if (specimen.data.settled_name) {
    return { ok: false, error: "That one is already settled." };
  }

  const existing = await db
    .from("plant_id_names")
    .select("id, name")
    .eq("specimen_id", specimenId);
  const match = (existing.data ?? []).find(
    (row) => (row.name as string).toLowerCase() === name.toLowerCase(),
  );
  if (match) return { ok: true, nameId: match.id as string };

  const inserted = await db
    .from("plant_id_names")
    .insert({ specimen_id: specimenId, name })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    return { ok: false, error: "That did not save. Try again." };
  }
  return { ok: true, nameId: inserted.data.id as string };
}

/**
 * One vote per plant per device. Voting again on a different name moves the
 * vote; voting again on the same name takes it back, which is what a student
 * who mis-clicked expects.
 */
export async function castVote(
  specimenId: string,
  nameId: string,
  voterKey: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "The class list is not switched on yet." };
  if (!voterKey) return { ok: false, error: "Could not tell which device this is." };

  const name = await db
    .from("plant_id_names")
    .select("id, specimen_id")
    .eq("id", nameId)
    .maybeSingle();
  if (name.error || !name.data || name.data.specimen_id !== specimenId) {
    return { ok: false, error: "That name is not on this plant." };
  }

  const current = await db
    .from("plant_id_votes")
    .select("id, name_id")
    .eq("specimen_id", specimenId)
    .eq("voter_key", voterKey)
    .maybeSingle();

  if (current.data) {
    if (current.data.name_id === nameId) {
      await db.from("plant_id_votes").delete().eq("id", current.data.id);
      return { ok: true };
    }
    await db.from("plant_id_votes").update({ name_id: nameId }).eq("id", current.data.id);
    return { ok: true };
  }

  const inserted = await db
    .from("plant_id_votes")
    .insert({ specimen_id: specimenId, name_id: nameId, voter_key: voterKey });
  if (inserted.error) return { ok: false, error: "That vote did not save. Try again." };
  return { ok: true };
}

/**
 * The teacher locks in the winning name. Gated on a code held in the server's
 * environment rather than an account, because this whole feature has no
 * accounts. It is a classroom lock, not a security boundary: it keeps a curious
 * student out, and there is nothing behind it worth more than that.
 */
export async function settleName(
  specimenId: string,
  name: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.GREENHOUSE_TEACHER_CODE;
  if (!expected) return { ok: false, error: "No teacher code is set on the server." };
  if (code !== expected) return { ok: false, error: "That code is not right." };

  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "The class list is not switched on yet." };

  const settled = name.trim();
  if (!settled) return { ok: false, error: "Pick a name to settle on." };

  const updated = await db
    .from("plant_id_specimens")
    .update({ settled_name: settled, settled_at: new Date().toISOString() })
    .eq("id", specimenId);
  if (updated.error) return { ok: false, error: "Could not settle that one." };
  return { ok: true };
}

/** True when the server has a teacher code configured at all. */
export function teacherCodeConfigured(): boolean {
  return Boolean(process.env.GREENHOUSE_TEACHER_CODE);
}

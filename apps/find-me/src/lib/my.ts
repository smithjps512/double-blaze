import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduledTask } from "./care-plan";

export interface MyAdoption {
  id: string;
  animalId: string;
  petName: string;
  status: "claimed" | "confirmed" | "rejected";
  claimedAt: string;
  shelterName: string;
}

export async function listMyAdoptions(db: SupabaseClient, userId: string): Promise<MyAdoption[]> {
  const { data } = await db
    .from("fm_adoptions")
    .select("id, animal_id, pet_name, status, claimed_at, fm_shelters(name)")
    .eq("user_id", userId)
    .order("claimed_at", { ascending: false });
  return ((data ?? []) as unknown as {
    id: string;
    animal_id: string;
    pet_name: string;
    status: MyAdoption["status"];
    claimed_at: string;
    fm_shelters: { name: string } | null;
  }[]).map((r) => ({
    id: r.id,
    animalId: r.animal_id,
    petName: r.pet_name,
    status: r.status,
    claimedAt: r.claimed_at,
    shelterName: r.fm_shelters?.name ?? "",
  }));
}

export async function listTasks(db: SupabaseClient, filter: { adoptionId?: string; userId?: string }): Promise<(ScheduledTask & { adoptionId: string })[]> {
  let q = db.from("fm_care_tasks").select("*").order("due_on");
  if (filter.adoptionId) q = q.eq("adoption_id", filter.adoptionId);
  if (filter.userId) q = q.eq("user_id", filter.userId);
  const { data } = await q;
  return ((data ?? []) as {
    id: string;
    adoption_id: string;
    key: string;
    kind: ScheduledTask["kind"];
    title: string;
    details: string;
    due_on: string;
    repeat_days: number | null;
    enabled: boolean;
    last_done_on: string | null;
  }[]).map((r) => ({
    id: r.id,
    adoptionId: r.adoption_id,
    key: r.key,
    kind: r.kind,
    title: r.title,
    details: r.details,
    dueOn: r.due_on,
    repeatDays: r.repeat_days,
    enabled: r.enabled,
    lastDoneOn: r.last_done_on,
  }));
}

"use server";

import { redirect } from "next/navigation";
import { buildCarePlan, schedulePlan, todayIso } from "@/lib/care-plan";
import { getAnimal, getShelter, isDemo, listClaimable } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

/**
 * The new owner picks their pet after scanning the shelter's QR code. They get
 * the care plan right away; the animal only leaves the listing when shelter
 * staff confirm the claim (build plan section 2).
 */
export async function claimAdoption(form: FormData): Promise<void> {
  const code = String(form.get("code") ?? "").toUpperCase();
  const animalId = String(form.get("animalId") ?? "");
  const petName = String(form.get("petName") ?? "").trim().slice(0, 60);
  if (!animalId) redirect(`/adopt/${code}?error=pick`);

  if (isDemo()) redirect(`/adopt/${code}/preview?animal=${encodeURIComponent(animalId)}&name=${encodeURIComponent(petName)}`);

  const { viewer, db } = await getViewer();
  if (!viewer || !db) redirect(`/sign-in?next=${encodeURIComponent(`/adopt/${code}`)}`);

  const shelter = await getShelter({ code });
  const claimable = await listClaimable(code);
  const pick = claimable.find((a) => a.id === animalId);
  if (!shelter || !pick) redirect(`/adopt/${code}?error=pick`);

  // The adopter can read the animal row once their claim exists; read the
  // details we need for the plan from the claimable list until then.
  const { data: existing } = await db
    .from("fm_adoptions")
    .select("id")
    .eq("user_id", viewer.id)
    .eq("animal_id", pick.id)
    .maybeSingle();
  if (existing) redirect(`/my/pets/${(existing as { id: string }).id}`);

  const { data: adoption, error } = await db
    .from("fm_adoptions")
    .insert({ user_id: viewer.id, animal_id: pick.id, shelter_id: shelter.id, pet_name: petName || pick.name })
    .select("id")
    .single();
  if (error || !adoption) {
    console.error("[find-me] claim:", error?.message);
    redirect(`/adopt/${code}?error=claim`);
  }
  const adoptionId = (adoption as { id: string }).id;

  const animal = await getAnimal(pick.id);
  const plan = schedulePlan(
    buildCarePlan({ species: animal?.species ?? pick.species, ageGroup: animal?.ageGroup ?? pick.ageGroup }),
    todayIso(),
  );
  const { error: taskError } = await db.from("fm_care_tasks").insert(
    plan.map((t) => ({
      adoption_id: adoptionId,
      user_id: viewer.id,
      key: t.key,
      kind: t.kind,
      title: t.title,
      details: t.details,
      due_on: t.dueOn,
      repeat_days: t.repeatDays,
      enabled: t.enabled,
    })),
  );
  if (taskError) console.error("[find-me] care tasks:", taskError.message);
  redirect(`/my/pets/${adoptionId}?welcome=1`);
}

"use server";

import { revalidatePath } from "next/cache";
import { loadAnswers } from "@/lib/answers";
import { getAnimal, getShelter, siteUrl } from "@/lib/data";
import { sendInquiryToShelter } from "@/lib/email";
import { getViewer } from "@/lib/viewer";

export interface InquiryState {
  ok?: boolean;
  error?: string;
}

/** "I'm interested": one inquiry per adopter per animal, emailed to the shelter. */
export async function sendInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  const animalId = String(form.get("animalId") ?? "");
  const message = String(form.get("message") ?? "").trim().slice(0, 2000);
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const share = form.get("shareAnswers") === "on";

  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { error: "Sign in first, so the shelter can reach you." };
  if (!name) return { error: "Add your name so the shelter knows who you are." };

  const animal = await getAnimal(animalId);
  if (!animal || animal.status === "adopted") return { error: "This pet is no longer available." };
  const shelter = await getShelter({ id: animal.shelterId });
  if (!shelter) return { error: "We could not find this pet's shelter." };

  const answers = share ? await loadAnswers() : null;
  const { error } = await db.from("fm_inquiries").insert({
    user_id: viewer.id,
    animal_id: animal.id,
    shelter_id: shelter.id,
    adopter_name: name,
    adopter_email: viewer.email,
    message,
    shared_answers: answers,
  });
  if (error) {
    if (error.code === "23505") return { error: `You already told ${shelter.name} you are interested. They will be in touch.` };
    console.error("[find-me] inquiry:", error.message);
    return { error: "That did not go through. Try again in a minute." };
  }

  if (shelter.email) {
    await sendInquiryToShelter({
      to: shelter.email,
      shelterName: shelter.name,
      animalName: animal.name,
      adopterName: name,
      adopterEmail: viewer.email,
      message,
      staffUrl: `${siteUrl()}/staff`,
    });
  }
  revalidatePath("/my");
  return { ok: true };
}

export async function toggleFavorite(form: FormData): Promise<void> {
  const animalId = String(form.get("animalId") ?? "");
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return;
  const { data } = await db.from("fm_favorites").select("animal_id").eq("user_id", viewer.id).eq("animal_id", animalId).maybeSingle();
  if (data) await db.from("fm_favorites").delete().eq("user_id", viewer.id).eq("animal_id", animalId);
  else await db.from("fm_favorites").insert({ user_id: viewer.id, animal_id: animalId });
  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/my");
}

"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAnimalForm, photoProblem } from "@/lib/animal-form";
import { animalToRow } from "@/lib/rows";
import { staffFor } from "@/lib/staff";
import { getServiceClient } from "@/lib/supabase";

export interface AnimalFormState {
  errors?: Record<string, string>;
  error?: string;
}

const DEMO_ERROR = "Demo mode: changes are not saved. In the live app this saves straight to your listing.";

/**
 * Uploads through the server with the service role, after the staff check in
 * staffFor, so the storage bucket needs no public write policy.
 */
async function uploadPhoto(shelterId: string, file: File): Promise<{ url?: string; error?: string }> {
  const problem = photoProblem(file);
  if (problem) return { error: problem };
  const service = getServiceClient();
  if (!service) return { error: "Photo uploads are not configured yet." };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${shelterId}/${randomUUID()}.${ext}`;
  const { error } = await service.storage.from("find-me-photos").upload(path, file, { contentType: file.type });
  if (error) {
    console.error("[find-me] photo upload:", error.message);
    return { error: "The photo did not upload. Try again." };
  }
  return { url: service.storage.from("find-me-photos").getPublicUrl(path).data.publicUrl };
}

export async function saveAnimal(_prev: AnimalFormState, form: FormData): Promise<AnimalFormState> {
  const shelterId = String(form.get("shelterId") ?? "");
  const animalId = String(form.get("animalId") ?? "");
  const ctx = await staffFor(shelterId);
  if (!ctx) return { error: DEMO_ERROR };

  const { value, errors } = parseAnimalForm(form);
  if (!value) return { errors };

  let photoUrl: string | null | undefined;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadPhoto(shelterId, photo);
    if (up.error) return { errors: { photo: up.error } };
    photoUrl = up.url;
  }

  const row = { ...animalToRow({ ...value, photoUrl: photoUrl ?? null }), updated_at: new Date().toISOString() };
  if (photoUrl === undefined) delete (row as Partial<typeof row>).photo_url;

  const query = animalId
    ? ctx.db.from("fm_animals").update(row).eq("id", animalId).eq("shelter_id", shelterId)
    : ctx.db.from("fm_animals").insert({ ...row, shelter_id: shelterId });
  const { error } = await query;
  if (error) {
    console.error("[find-me] save animal:", error.message);
    return { error: "That did not save. Try again." };
  }
  revalidatePath("/staff");
  revalidatePath("/animals");
  redirect(`/staff?shelter=${shelterId}&saved=${encodeURIComponent(value.name)}`);
}

export async function setAnimalStatus(form: FormData): Promise<void> {
  const shelterId = String(form.get("shelterId") ?? "");
  const status = String(form.get("status") ?? "");
  const ctx = await staffFor(shelterId);
  if (!ctx || !["available", "on_hold", "adopted"].includes(status)) return;
  await ctx.db
    .from("fm_animals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", String(form.get("animalId") ?? ""))
    .eq("shelter_id", shelterId);
  revalidatePath("/staff");
  revalidatePath("/animals");
}

export async function setInquiryStatus(form: FormData): Promise<void> {
  const shelterId = String(form.get("shelterId") ?? "");
  const status = String(form.get("status") ?? "");
  const ctx = await staffFor(shelterId);
  if (!ctx || !["new", "contacted", "closed"].includes(status)) return;
  await ctx.db
    .from("fm_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", String(form.get("inquiryId") ?? ""))
    .eq("shelter_id", shelterId);
  revalidatePath("/staff");
}

/** Confirming takes the animal off the listing (a database trigger does it). */
export async function reviewClaim(form: FormData): Promise<void> {
  const shelterId = String(form.get("shelterId") ?? "");
  const decision = String(form.get("decision") ?? "");
  const ctx = await staffFor(shelterId);
  if (!ctx || !["confirmed", "rejected"].includes(decision)) return;
  await ctx.db
    .from("fm_adoptions")
    .update({ status: decision })
    .eq("id", String(form.get("adoptionId") ?? ""))
    .eq("shelter_id", shelterId);
  revalidatePath("/staff");
  revalidatePath("/animals");
}

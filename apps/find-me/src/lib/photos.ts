import "server-only";
import { randomUUID } from "node:crypto";
import { photoProblem } from "./animal-form";
import { getServiceClient } from "./supabase";

/**
 * Uploads through the server with the service role, after the caller has
 * checked who may upload, so the bucket needs no public write policy.
 * `folder` is a shelter id for listings, or `reports/<user id>` for lost and
 * found posts.
 */
export async function uploadPhoto(folder: string, file: File): Promise<{ url?: string; error?: string }> {
  const problem = photoProblem(file);
  if (problem) return { error: problem };
  const service = getServiceClient();
  if (!service) return { error: "Photo uploads are not configured yet." };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const { error } = await service.storage.from("find-me-photos").upload(path, file, { contentType: file.type });
  if (error) {
    console.error("[find-me] photo upload:", error.message);
    return { error: "The photo did not upload. Try again." };
  }
  return { url: service.storage.from("find-me-photos").getPublicUrl(path).data.publicUrl };
}

/** The photo field from a form, or null if none was chosen. */
export function photoFrom(form: FormData, field = "photo"): File | null {
  const f = form.get(field);
  return f instanceof File && f.size > 0 ? f : null;
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isEmail } from "@/lib/auth-rules";
import { sendSignInLink } from "@/lib/email";
import { adoptionCode, slugify } from "@/lib/shelter-form";
import { getServiceClient } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";

export interface AdminState {
  ok?: string;
  error?: string;
}

async function requireAdmin() {
  const { viewer, db } = await getViewer();
  return viewer?.isAdmin && db ? { viewer, db } : null;
}

export async function createShelter(_prev: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admins only." };
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  if (name.length < 2) return { error: "Add the shelter's name." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (email && !isEmail(email)) return { error: "That inquiry email does not look right." };

  const base = {
    name,
    city: String(form.get("city") ?? "").trim().slice(0, 80),
    email,
    phone: String(form.get("phone") ?? "").trim().slice(0, 40),
    website: String(form.get("website") ?? "").trim().slice(0, 200),
  };
  // Try a few suffixes in case the slug or code is already taken.
  for (const suffix of ["", "2", "3", "4", "5"]) {
    const { error } = await admin.db.from("fm_shelters").insert({
      ...base,
      slug: (slugify(name) || "shelter") + (suffix ? `-${suffix}` : ""),
      adoption_code: adoptionCode(name, suffix),
    });
    if (!error) {
      revalidatePath("/admin");
      return { ok: `${name} added. Now invite their staff.` };
    }
    if (error.code !== "23505") {
      console.error("[find-me] create shelter:", error.message);
      return { error: "That did not save." };
    }
  }
  return { error: "A shelter with that name already exists." };
}

/**
 * Makes someone staff at a shelter and emails them a sign-in link that lands
 * on the dashboard. generateLink creates the account if it does not exist.
 */
export async function inviteStaff(_prev: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const service = getServiceClient();
  if (!admin || !service) return { error: "Admins only." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const shelterId = String(form.get("shelterId") ?? "");
  const role = form.get("role") === "manager" ? "manager" : "staff";
  if (!isEmail(email)) return { error: "Enter a valid email." };

  const { data, error } = await service.auth.admin.generateLink({ type: "magiclink", email });
  const user = data?.user;
  const hashed = data?.properties?.hashed_token;
  if (error || !user || !hashed) {
    console.error("[find-me] invite:", error?.message);
    return { error: "Could not create that account." };
  }
  const { error: staffError } = await service
    .from("fm_staff")
    .upsert({ user_id: user.id, shelter_id: shelterId, role }, { onConflict: "user_id,shelter_id" });
  if (staffError) {
    console.error("[find-me] staff row:", staffError.message);
    return { error: "Could not add them to the shelter." };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const type = new URL(data.properties.action_link).searchParams.get("type") ?? "magiclink";
  const sent = await sendSignInLink(
    email,
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashed)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent("/staff")}`,
  );
  revalidatePath("/admin");
  return sent ? { ok: `${email} is staff now. We emailed them a sign-in link.` } : { ok: `${email} is staff now, but the email did not send. They can sign in from /sign-in.` };
}

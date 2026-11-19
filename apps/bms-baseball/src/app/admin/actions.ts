"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, passwordMatches, signIn, signOut } from "@/lib/admin-auth";
import { getServiceClient, TABLE } from "@/lib/supabase";

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const attempt = String(formData.get("password") ?? "");
  if (!passwordMatches(attempt)) {
    // A small pause makes guessing slow.
    await new Promise((r) => setTimeout(r, 800));
    return "That password didn't work.";
  }
  await signIn();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await signOut();
  redirect("/admin");
}

export async function deleteSignup(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const db = getServiceClient();
  if (db && /^[0-9a-f-]{36}$/i.test(id)) {
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (error) console.error("bmsb delete failed", error.message);
  }
  revalidatePath("/admin");
}

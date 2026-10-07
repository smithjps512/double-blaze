"use server";

import { redirect } from "next/navigation";
import { validateSurvey, type SurveyAnswers } from "@/lib/survey";
import { getViewer } from "@/lib/viewer";
import { sendConfirmation } from "@/lib/email";

export interface SaveState {
  errors?: Partial<Record<keyof SurveyAnswers, string>>;
  formError?: string;
  /** What was submitted, so a rejected form comes back filled in. */
  values?: Record<string, string | string[]>;
}

export async function saveInterest(_prev: SaveState, form: FormData): Promise<SaveState> {
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return { formError: "Your sign in expired. Sign in again and your answers will be waiting." };

  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };
  const values = {
    name: text("name"),
    role: text("role"),
    interest_level: text("interest_level"),
    interests: form.getAll("interests").filter((v): v is string => typeof v === "string"),
    preferred_lot: text("preferred_lot"),
    painter: text("painter"),
    keep_yearly: text("keep_yearly"),
    price_comfort: text("price_comfort"),
    comments: text("comments"),
  };

  const result = validateSurvey(values, { isBoss: viewer.isBoss });
  if (!result.ok) return { errors: result.errors, formError: "A few answers need a look.", values };

  const { data: existing } = await db
    .from("pys_interest_responses")
    .select("user_id")
    .eq("user_id", viewer.id)
    .maybeSingle();

  const { error } = await db
    .from("pys_interest_responses")
    .upsert({ user_id: viewer.id, email: viewer.email, ...result.answers }, { onConflict: "user_id" });
  if (error) {
    console.error("[paint-your-spot] save failed:", error.message);
    return { formError: "That did not save. Try again in a moment.", values };
  }

  if (!existing) await sendConfirmation(viewer.email, result.answers.name);
  redirect("/interest?saved=1");
}

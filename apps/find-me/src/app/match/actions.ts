"use server";

import { redirect } from "next/navigation";
import { saveAnswers } from "@/lib/answers";
import { safeNext } from "@/lib/auth-rules";
import { answersFromForm } from "@/lib/quiz";

export async function submitQuiz(form: FormData): Promise<void> {
  await saveAnswers(answersFromForm(form));
  redirect(safeNext(String(form.get("next") ?? ""), "/matches"));
}

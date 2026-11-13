"use server";

import { revalidatePath } from "next/cache";
import { completeTask, todayIso } from "@/lib/care-plan";
import { getViewer } from "@/lib/viewer";

type TaskRow = { id: string; adoption_id: string; due_on: string; repeat_days: number | null; enabled: boolean };

async function ownTask(form: FormData) {
  const id = String(form.get("taskId") ?? "");
  const { viewer, db } = await getViewer();
  if (!viewer || !db) return null;
  // RLS limits this to the viewer's own tasks.
  const { data } = await db.from("fm_care_tasks").select("id, adoption_id, due_on, repeat_days, enabled").eq("id", id).maybeSingle();
  return data ? { db, task: data as TaskRow } : null;
}

export async function completeCareTask(form: FormData): Promise<void> {
  const found = await ownTask(form);
  if (!found) return;
  const next = completeTask({ dueOn: found.task.due_on, repeatDays: found.task.repeat_days }, todayIso());
  await found.db.from("fm_care_tasks").update({ due_on: next.dueOn, last_done_on: next.lastDoneOn }).eq("id", found.task.id);
  revalidatePath(`/my/pets/${found.task.adoption_id}`);
  revalidatePath("/my");
}

export async function toggleCareTask(form: FormData): Promise<void> {
  const found = await ownTask(form);
  if (!found) return;
  const turningOn = !found.task.enabled;
  const today = todayIso();
  // An opt-in reminder switched on today starts from today, not from the adoption day.
  const patch: Record<string, unknown> = { enabled: turningOn };
  if (turningOn && found.task.due_on < today) patch.due_on = today;
  await found.db.from("fm_care_tasks").update(patch).eq("id", found.task.id);
  revalidatePath(`/my/pets/${found.task.adoption_id}`);
  revalidatePath("/my");
}

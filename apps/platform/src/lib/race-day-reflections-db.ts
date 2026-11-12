import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import type { CheckedReflection, PhaseId } from "./race-day/reflection";

/**
 * Storage for the project reflection. See
 * supabase/migrations/0054_race_day_reflections.sql. Service role only,
 * behind the class password (submit) or the teacher code (everything else).
 */

export interface StoredReflection {
  id: string;
  fullName: string;
  period: number;
  ratings: Record<PhaseId, { enjoyed: number; did: number }>;
  answers: Record<string, string>;
  words: number;
  submittedAt: string;
  score: number | null;
  teacherNote: string;
  reviewed: boolean;
}

export type Saved = { ok: true } | { ok: false; error: string };

const OFFLINE = "The database is not connected, so reflections cannot be saved yet.";

export function canSave(): boolean {
  return getSupabaseServiceClient() !== null;
}

export async function submitReflection(r: CheckedReflection): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: OFFLINE };
  const { error } = await db.from("race_day_reflections").insert({
    full_name: r.fullName,
    period: r.period,
    ratings: r.ratings,
    answers: r.answers,
    words: r.words,
  });
  if (error) {
    console.error("[race-day] reflection insert failed", error.message);
    return { ok: false, error: "Could not save your reflection. Your answers are still on this page. Try again in a minute." };
  }
  return { ok: true };
}

export async function loadReflections(): Promise<{ rows: StoredReflection[]; source: "db" | "none"; error?: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { rows: [], source: "none" };
  const { data, error } = await db
    .from("race_day_reflections")
    .select("id, full_name, period, ratings, answers, words, submitted_at, score, teacher_note, reviewed")
    .order("submitted_at", { ascending: false });
  if (error) {
    console.error("[race-day] reflections read failed", error.message);
    return { rows: [], source: "db", error: "Could not read reflections. Check that migration 0054 is applied." };
  }
  return {
    source: "db",
    rows: (data ?? []).map((x) => ({
      id: x.id as string,
      fullName: x.full_name as string,
      period: x.period as number,
      ratings: x.ratings as StoredReflection["ratings"],
      answers: x.answers as Record<string, string>,
      words: x.words as number,
      submittedAt: x.submitted_at as string,
      score: (x.score as number | null) ?? null,
      teacherNote: (x.teacher_note as string) ?? "",
      reviewed: !!x.reviewed,
    })),
  };
}

export async function reviewReflection(
  id: string,
  patch: { score?: number | null; teacherNote?: string; reviewed?: boolean },
): Promise<Saved> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: OFFLINE };
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.score !== undefined) row.score = patch.score;
  if (patch.teacherNote !== undefined) row.teacher_note = patch.teacherNote;
  if (patch.reviewed !== undefined) row.reviewed = patch.reviewed;
  const { error } = await db.from("race_day_reflections").update(row).eq("id", id);
  if (error) {
    console.error("[race-day] reflection review failed", error.message);
    return { ok: false, error: "Could not save the review." };
  }
  return { ok: true };
}

import "server-only";
import { callSparkStructured } from "./anthropic";
import { getSupabaseServiceClient } from "./supabase";
import type { GameMode } from "./smart-cities";

/**
 * Storage for the Period 3 Smart Cities: answers to the designer questions and
 * the game leaderboards. See supabase/migrations/0038_smart_cities.sql.
 *
 * Service role only. Every function tolerates Supabase being unconfigured and
 * says so rather than throwing, so a city page keeps working (without the
 * shared parts) on a preview with no database.
 */

export interface CityAnswer {
  id: string;
  citySlug: string;
  questionIndex: number;
  answer: string;
  writer: "designer" | "classmate";
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

interface AnswerRow {
  id: string;
  city_slug: string;
  question_index: number;
  answer: string;
  writer: "designer" | "classmate";
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

function toAnswer(r: AnswerRow): CityAnswer {
  return {
    id: r.id,
    citySlug: r.city_slug,
    questionIndex: r.question_index,
    answer: r.answer,
    writer: r.writer,
    status: r.status,
    flagged: r.flagged,
    flagReason: r.flag_reason,
    createdAt: r.created_at,
  };
}

const SCREEN_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["concern", "reason"],
  properties: {
    concern: { type: "string", enum: ["none", "off_topic", "joke", "inappropriate"] },
    reason: { type: "string" },
  },
};

/**
 * Tag an answer for the teacher. Like the Trail Crew screen, this never
 * rejects: an eleven year old's honest answer must not vanish because a model
 * misread it. It only puts a note beside the answer in the queue.
 */
export async function screenAnswer(question: string, answer: string): Promise<{ flagged: boolean; flagReason: string | null }> {
  const result = await callSparkStructured<{ concern: string; reason: string }>({
    system: `You are helping a middle school teacher triage answers from sixth graders (eleven and twelve years old). Each answer replies to a question about a "smart city" a classmate drew.

Be generous. Short answers, spelling mistakes, silly-but-sincere ideas, and imaginative inventions are all NORMAL and are "none".

- "none": a real attempt to answer, however rough or imaginative.
- "off_topic": clearly not an answer, for example random letters or a message to a friend.
- "joke": deliberately messing around.
- "inappropriate": rude, insulting, sexual, violent, or naming and targeting a person.

Give a one-sentence reason addressed to the teacher.`,
    messages: [{ role: "user", content: `Question: ${question}\n\nAnswer: ${answer}` }],
    schema: SCREEN_SCHEMA,
    maxTokens: 200,
  });
  if (!result || result.concern === "none") return { flagged: false, flagReason: null };
  return { flagged: true, flagReason: `${result.concern}: ${result.reason}` };
}

export async function submitAnswer(input: {
  citySlug: string;
  questionIndex: number;
  answer: string;
  writer: "designer" | "classmate";
  flagged: boolean;
  flagReason: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "Answers are not switched on yet." };
  const { data, error } = await db
    .from("smart_city_answers")
    .insert({
      city_slug: input.citySlug,
      question_index: input.questionIndex,
      answer: input.answer,
      writer: input.writer,
      flagged: input.flagged,
      flag_reason: input.flagReason,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[smart-cities] answer insert failed", error?.message);
    return { ok: false, error: "Could not save your answer. Try again." };
  }
  return { ok: true, id: data.id as string };
}

export async function approvedAnswers(citySlug: string): Promise<CityAnswer[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("smart_city_answers")
    .select("*")
    .eq("city_slug", citySlug)
    .eq("status", "approved")
    .order("decided_at", { ascending: true });
  if (error) {
    console.error("[smart-cities] approved read failed", error.message);
    return [];
  }
  return (data as AnswerRow[]).map(toAnswer);
}

export async function listAnswers(status: CityAnswer["status"], limit = 200): Promise<CityAnswer[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("smart_city_answers")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(limit);
  if (error) {
    console.error("[smart-cities] list failed", error.message);
    return [];
  }
  return (data as AnswerRow[]).map(toAnswer);
}

export async function decideAnswer(id: string, decision: "approved" | "rejected" | "pending"): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("smart_city_answers")
    .update({ status: decision, decided_at: decision === "pending" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[smart-cities] decide failed", error.message);
  return !error;
}

// ---------------------------------------------------------------------------
// Leaderboards
// ---------------------------------------------------------------------------

export interface BoardRow {
  initials: string;
  score: number;
  mine: boolean;
}

export const BOARD_SIZE = 10;

export async function leaderboard(citySlug: string, mode: GameMode, playerKey: string | null): Promise<BoardRow[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("smart_city_scores")
    .select("initials, score, player_key, created_at")
    .eq("city_slug", citySlug)
    .eq("mode", mode)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(BOARD_SIZE);
  if (error) {
    console.error("[smart-cities] board read failed", error.message);
    return null;
  }
  return (data as Array<{ initials: string; score: number; player_key: string }>).map((r) => ({
    initials: r.initials,
    score: r.score,
    mine: !!playerKey && r.player_key === playerKey,
  }));
}

/** Keeps each device's best score per game. Returns whether it was a new best. */
export async function postScore(input: {
  citySlug: string;
  mode: GameMode;
  initials: string;
  score: number;
  playerKey: string;
}): Promise<{ ok: true; best: boolean } | { ok: false; error: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "The class leaderboard is not switched on yet." };
  const { data: existing } = await db
    .from("smart_city_scores")
    .select("id, score")
    .eq("city_slug", input.citySlug)
    .eq("mode", input.mode)
    .eq("player_key", input.playerKey)
    .maybeSingle();

  if (existing && (existing.score as number) >= input.score) {
    // Not a new best, but keep the latest initials the device chose.
    await db.from("smart_city_scores").update({ initials: input.initials }).eq("id", existing.id);
    return { ok: true, best: false };
  }

  const row = {
    city_slug: input.citySlug,
    mode: input.mode,
    initials: input.initials,
    score: input.score,
    player_key: input.playerKey,
    created_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await db.from("smart_city_scores").update(row).eq("id", existing.id)
    : await db.from("smart_city_scores").insert(row);
  if (error) {
    console.error("[smart-cities] score write failed", error.message);
    return { ok: false, error: "Could not save your score." };
  }
  return { ok: true, best: true };
}

export async function clearBoard(citySlug: string, mode: GameMode): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db.from("smart_city_scores").delete().eq("city_slug", citySlug).eq("mode", mode);
  if (error) console.error("[smart-cities] clear failed", error.message);
  return !error;
}

export async function removeScore(citySlug: string, mode: GameMode, initials: string): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("smart_city_scores")
    .delete()
    .eq("city_slug", citySlug)
    .eq("mode", mode)
    .eq("initials", initials);
  return !error;
}

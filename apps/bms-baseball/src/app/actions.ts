"use server";

import { validateSignup, type FieldErrors, type SignupInput } from "@/lib/signup";
import { getServiceClient, TABLE } from "@/lib/supabase";

export type SubmitResult =
  | { status: "success"; firstName: string }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "error"; message: string };

/** Anything faster than this from page load to submit is a bot. */
const MIN_FILL_MS = 3000;

export async function submitSignup(
  input: SignupInput & { website?: unknown; startedAt?: unknown },
): Promise<SubmitResult> {
  const checked = validateSignup(input);
  if (!checked.ok) return { status: "invalid", errors: checked.errors };
  const s = checked.data;

  // Spam traps: a hidden field people never see, and a too-fast submit.
  // Bots get a normal looking success so they do not retry.
  const started = Number(input.startedAt);
  const tooFast = !Number.isFinite(started) || Date.now() - started < MIN_FILL_MS;
  if ((typeof input.website === "string" && input.website !== "") || tooFast) {
    return { status: "success", firstName: s.firstName };
  }

  const db = getServiceClient();
  if (!db) {
    return { status: "error", message: "Sign ups aren't switched on yet. Please tell your coach!" };
  }

  const { error } = await db.from(TABLE).insert({
    first_name: s.firstName,
    last_name: s.lastName,
    grade: s.grade,
    positions: s.positions,
    years_played: s.yearsPlayed,
    played_where: s.playedWhere,
    team_names: s.teamNames,
    notes: s.notes,
  });
  if (error) {
    console.error("bmsb insert failed", error.message);
    return { status: "error", message: "Something went wrong saving that. Please try again in a minute." };
  }
  return { status: "success", firstName: s.firstName };
}

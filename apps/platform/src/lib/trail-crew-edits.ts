import "server-only";
import { callSparkStructured } from "./anthropic";
import { getSupabaseServiceClient } from "./supabase";
import buildContext from "@/data/build-context.json";

/**
 * Student proposals to change a user story.
 *
 * The rule that shapes every function here: a proposal never changes a
 * document. Students submit, a teacher decides, and only an approval writes to
 * the repository. Twelve year olds will test that boundary on the first day, so
 * it is enforced by there being no other code path rather than by care.
 *
 * Approval writes a commit, which means git history is the audit trail: who
 * changed which story, when, and what it said before. Nothing extra to build and
 * nothing to keep in sync.
 */

export const MAX_PROPOSAL_LENGTH = 1200;
export const MAX_REASON_LENGTH = 400;

export interface StoryEdit {
  id: string;
  team_slug: string;
  story_heading: string;
  original_text: string;
  proposed_text: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  flag_reason: string | null;
  decided_at: string | null;
  created_at: string;
}

interface TeamContext {
  productName: string;
  teamName?: string;
  cards?: string;
  architecture?: string;
  stories?: string;
}

const context = buildContext as { teams: Record<string, TeamContext> };

export function teamExists(slug: string): boolean {
  return !!context.teams?.[slug];
}

export function teamLabel(slug: string): string {
  const team = context.teams?.[slug];
  if (!team) return slug;
  return team.teamName ? `${team.productName} (${team.teamName})` : team.productName;
}

// ---------------------------------------------------------------------------
// Screening
// ---------------------------------------------------------------------------

const SCREEN_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["concern", "reason"],
  properties: {
    concern: {
      type: "string",
      enum: ["none", "not_a_story", "joke", "inappropriate"],
    },
    reason: { type: "string" },
  },
};

/**
 * Look at a proposal before it reaches the teacher's queue.
 *
 * This only ever tags. Nothing is rejected, hidden or thrown away by a model,
 * because the cost of wrongly discarding one real proposal from a twelve year
 * old who worked up the nerve to write it is far higher than the cost of the
 * teacher reading a joke.
 */
export async function screenProposal(input: {
  proposed: string;
  reason: string;
}): Promise<{ flagged: boolean; flagReason: string | null }> {
  const result = await callSparkStructured<{ concern: string; reason: string }>({
    system: `You are helping a middle school teacher triage proposed edits to user stories written by his students, who are twelve and thirteen.

Classify the submission. Be generous: clumsy writing, spelling mistakes, a story that is too vague, or a student who has misunderstood the assignment are all NORMAL and are "none". This is their first time and the teacher wants to see that work.

- "none": a genuine attempt to improve a user story, however rough.
- "not_a_story": clearly not an attempt at the assignment, for example random characters or a message to a friend.
- "joke": deliberately silly content submitted to mess around.
- "inappropriate": rude, insulting, sexual, violent, or naming and targeting a person.

Give a short reason, one sentence, addressed to the teacher.`,
    messages: [
      {
        role: "user",
        content: `Proposed story text:\n${input.proposed}\n\nTheir reason for the change:\n${input.reason || "(none given)"}`,
      },
    ],
    schema: SCREEN_SCHEMA,
    maxTokens: 200,
  });

  // A screening pass that cannot run must not block a submission.
  if (!result) return { flagged: false, flagReason: null };
  if (result.concern === "none") return { flagged: false, flagReason: null };
  return { flagged: true, flagReason: `${result.concern}: ${result.reason}` };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function submitEdit(input: {
  slug: string;
  storyHeading: string;
  originalText: string;
  proposedText: string;
  reason: string;
  flagged: boolean;
  flagReason: string | null;
}): Promise<{ ok: boolean; id?: string }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.error("[trail-crew] no Supabase client; proposal not stored");
    return { ok: false };
  }
  const { data, error } = await supabase
    .from("trail_crew_story_edits")
    .insert({
      team_slug: input.slug,
      story_heading: input.storyHeading.slice(0, 200),
      original_text: input.originalText.slice(0, MAX_PROPOSAL_LENGTH),
      proposed_text: input.proposedText.slice(0, MAX_PROPOSAL_LENGTH),
      reason: input.reason.slice(0, MAX_REASON_LENGTH) || null,
      flagged: input.flagged,
      flag_reason: input.flagReason,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[trail-crew] could not store proposal: ${error.message}`);
    return { ok: false };
  }
  return { ok: true, id: data.id as string };
}

export async function listEdits(status: StoryEdit["status"] = "pending"): Promise<StoryEdit[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trail_crew_story_edits")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error(`[trail-crew] could not list proposals: ${error.message}`);
    return [];
  }
  return (data ?? []) as StoryEdit[];
}

export async function getEdit(id: string): Promise<StoryEdit | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("trail_crew_story_edits")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as StoryEdit;
}

export async function recordDecision(input: {
  id: string;
  status: "approved" | "rejected";
  decidedBy: string;
  appliedText?: string;
}): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("trail_crew_story_edits")
    .update({
      status: input.status,
      decided_by: input.decidedBy,
      decided_at: new Date().toISOString(),
      applied_text: input.appliedText ?? null,
    })
    .eq("id", input.id);
  if (error) {
    console.error(`[trail-crew] could not record decision: ${error.message}`);
    return false;
  }
  return true;
}

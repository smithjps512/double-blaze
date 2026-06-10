import "server-only";
import {
  callSpark,
  extractJson,
  isAnthropicConfigured,
  type AnthropicMessage,
} from "./anthropic";
import { getQuestionSet, requiredFieldKeys } from "./intake-questions";
import { getDeliverableTemplate } from "./deliverable-templates";

/**
 * Spark, the Double Blaze intake assistant (spec section 6). This module owns
 * the prompts and the structured contracts: conversational intake turns and
 * brief assembly/revision. Everything is server-only; the API key never leaves
 * `anthropic.ts`.
 *
 * House style for Spark: warm, plainspoken, in scope for the specific offering,
 * and no em dashes.
 */

export { isAnthropicConfigured };

// ---------------------------------------------------------------------------
// Intake turn
// ---------------------------------------------------------------------------
export interface IntakeTurnResult {
  /** Spark's conversational reply to show and store as the assistant turn. */
  reply: string;
  /** Cumulative captured fields (keyed by intake-question field keys). */
  captured: Record<string, unknown>;
  /** True when enough is captured to assemble the brief. */
  readyForBrief: boolean;
}

function intakeSystemPrompt(catalogKey: string): string | null {
  const set = getQuestionSet(catalogKey);
  if (!set) return null;

  const groups = set.groups
    .map((g) => {
      const fields = g.fields
        .map(
          (f) =>
            `    - ${f.key} (${f.label}${f.required ? ", required" : ""}): ${f.prompt}`,
        )
        .join("\n");
      return `  ${g.title}:\n${fields}`;
    })
    .join("\n");

  const required = requiredFieldKeys(catalogKey).join(", ");

  return `You are Spark, the intake assistant for Double Blaze Solutions, a veteran-owned technology company. You are scoping one specific offering: ${set.offeringName}.

${set.intro}

Your job is to interview the client conversationally and capture the information needed to scope this work. Guidelines:
- Be warm, plainspoken, and encouraging. Keep replies short.
- Ask only a few questions at a time, grouped naturally. Do not dump the whole list.
- Confirm answers briefly before moving on.
- Stay strictly in scope for ${set.offeringName}. If the client asks for something outside this offering, note it kindly and keep going.
- Never use em dashes.

Here are the fields to capture, grouped:
${groups}

Required fields before the work can be scoped: ${required || "(none)"}.

You must respond with STRICT JSON only, no prose outside the JSON, matching exactly:
{
  "reply": "your next conversational message to the client",
  "captured": { "field_key": "value", ... },
  "readyForBrief": false
}

Rules for the JSON:
- "captured" must be the FULL set of fields you have learned so far across the whole conversation, not just this turn. Carry forward everything already known.
- Only include a field in "captured" once the client has actually answered it. Omit unknown fields.
- Set "readyForBrief" to true only when every required field is captured and you have enough to scope the work. When true, "reply" should tell the client you have what you need and are preparing their project brief.`;
}

/**
 * Run one intake turn. `history` is the prior transcript; `userMessage` is the
 * client's latest message (empty string for the opening turn). `known` is the
 * captured-so-far map, fed back so the model carries it forward even if it
 * forgets. Returns null only when Spark is unavailable.
 */
export async function runIntakeTurn(args: {
  catalogKey: string;
  history: AnthropicMessage[];
  userMessage: string;
  known: Record<string, unknown>;
}): Promise<IntakeTurnResult | null> {
  const system = intakeSystemPrompt(args.catalogKey);
  if (!system) return null;

  const messages: AnthropicMessage[] = [...args.history];
  // Seed the conversation if this is the opening turn.
  if (messages.length === 0 && !args.userMessage) {
    messages.push({
      role: "user",
      content:
        "Please introduce yourself briefly and ask your first questions to begin the intake.",
    });
  } else {
    // Remind the model of what is already captured, then add the user's turn.
    if (Object.keys(args.known).length > 0) {
      messages.push({
        role: "user",
        content: `Context (already captured, carry forward): ${JSON.stringify(
          args.known,
        )}`,
      });
    }
    if (args.userMessage) {
      messages.push({ role: "user", content: args.userMessage });
    }
  }

  const raw = await callSpark({ system, messages, maxTokens: 1200 });
  const parsed = extractJson<{
    reply?: string;
    captured?: Record<string, unknown>;
    readyForBrief?: boolean;
  }>(raw);

  if (!parsed || typeof parsed.reply !== "string") {
    // Parsing failed but Spark is configured: degrade gracefully so the client
    // is not stuck. Treat any raw text as the reply, keep prior captured state.
    if (raw) {
      return { reply: raw, captured: args.known, readyForBrief: false };
    }
    return null;
  }

  const captured = {
    ...args.known,
    ...(parsed.captured && typeof parsed.captured === "object"
      ? parsed.captured
      : {}),
  };

  // Belt and suspenders: only allow readyForBrief when required fields exist.
  const required = requiredFieldKeys(args.catalogKey);
  const haveAllRequired = required.every(
    (k) => captured[k] !== undefined && captured[k] !== null && captured[k] !== "",
  );

  return {
    reply: parsed.reply,
    captured,
    readyForBrief: !!parsed.readyForBrief && haveAllRequired,
  };
}

// ---------------------------------------------------------------------------
// Brief assembly
// ---------------------------------------------------------------------------
export interface BriefContent {
  scope_summary: string;
  deliverables: Array<{ title: string; description: string }>;
  assets_needed: string[];
  timeline: string;
  monthly_cadence: string;
  open_questions: string[];
}

function briefSystemPrompt(catalogKey: string): string | null {
  const set = getQuestionSet(catalogKey);
  const template = getDeliverableTemplate(catalogKey);
  if (!set || !template) return null;

  const templateDeliverables = template.items
    .map((i) => `  - ${i.title}: ${i.description}`)
    .join("\n");

  return `You are Spark, assembling a project brief for Double Blaze Solutions for the offering: ${set.offeringName}.

Use the captured intake fields to write a clear, client-facing brief. Align the deliverables to this offering's deliverable template:
${templateDeliverables}

Monthly cadence for this offering: ${template.cadenceSummary}

Write in a warm, plainspoken voice. Never use em dashes.

Respond with STRICT JSON only, matching exactly this shape:
{
  "scope_summary": "a short paragraph describing the scope of work",
  "deliverables": [ { "title": "...", "description": "..." } ],
  "assets_needed": [ "things the client must provide" ],
  "timeline": "a short description of the overall timeline",
  "monthly_cadence": "how the work and deliverables recur each month",
  "open_questions": [ "anything still unclear or to confirm" ]
}

Keep deliverables aligned to the template above but tailored to what the client told you. If there are no open questions, return an empty array.`;
}

/**
 * Assemble a structured brief from captured intake. Returns null if Spark is
 * unavailable or the response cannot be parsed into the expected shape.
 */
export async function assembleBrief(args: {
  catalogKey: string;
  captured: Record<string, unknown>;
}): Promise<BriefContent | null> {
  const system = briefSystemPrompt(args.catalogKey);
  if (!system) return null;

  const raw = await callSpark({
    system,
    messages: [
      {
        role: "user",
        content: `Captured intake fields:\n${JSON.stringify(
          args.captured,
          null,
          2,
        )}\n\nAssemble the project brief as strict JSON.`,
      },
    ],
    maxTokens: 2000,
  });

  return normalizeBrief(extractJson(raw));
}

/**
 * Revise an existing brief from the client's change notes (workflow step 4).
 * Returns null on failure so the caller can keep the prior brief.
 */
export async function reviseBrief(args: {
  catalogKey: string;
  current: BriefContent;
  notes: string;
}): Promise<BriefContent | null> {
  const system = briefSystemPrompt(args.catalogKey);
  if (!system) return null;

  const raw = await callSpark({
    system,
    messages: [
      {
        role: "user",
        content: `Here is the current brief as JSON:\n${JSON.stringify(
          args.current,
          null,
          2,
        )}\n\nThe client requested these changes:\n${args.notes}\n\nReturn the full revised brief as strict JSON in the same shape.`,
      },
    ],
    maxTokens: 2000,
  });

  return normalizeBrief(extractJson(raw));
}

/** Coerce an unknown parsed object into a safe BriefContent, or null. */
function normalizeBrief(parsed: unknown): BriefContent | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const deliverables = Array.isArray(p.deliverables)
    ? p.deliverables
        .map((d) => {
          if (!d || typeof d !== "object") return null;
          const dr = d as Record<string, unknown>;
          if (typeof dr.title !== "string") return null;
          return {
            title: dr.title,
            description:
              typeof dr.description === "string" ? dr.description : "",
          };
        })
        .filter((d): d is { title: string; description: string } => d !== null)
    : [];

  if (typeof p.scope_summary !== "string" || deliverables.length === 0) {
    return null;
  }

  return {
    scope_summary: p.scope_summary,
    deliverables,
    assets_needed: asStringArray(p.assets_needed),
    timeline: typeof p.timeline === "string" ? p.timeline : "",
    monthly_cadence:
      typeof p.monthly_cadence === "string" ? p.monthly_cadence : "",
    open_questions: asStringArray(p.open_questions),
  };
}

/**
 * Render a brief to a readable plain-text summary for storage and display.
 * Deterministic (no model call) so it is reliable and cheap.
 */
export function renderBriefSummary(brief: BriefContent): string {
  const lines: string[] = [];
  lines.push("Scope");
  lines.push(brief.scope_summary);
  lines.push("");
  lines.push("Deliverables");
  for (const d of brief.deliverables) {
    lines.push(`- ${d.title}: ${d.description}`);
  }
  if (brief.assets_needed.length) {
    lines.push("");
    lines.push("What we need from you");
    for (const a of brief.assets_needed) lines.push(`- ${a}`);
  }
  if (brief.timeline) {
    lines.push("");
    lines.push("Timeline");
    lines.push(brief.timeline);
  }
  if (brief.monthly_cadence) {
    lines.push("");
    lines.push("Monthly cadence");
    lines.push(brief.monthly_cadence);
  }
  if (brief.open_questions.length) {
    lines.push("");
    lines.push("Open questions");
    for (const q of brief.open_questions) lines.push(`- ${q}`);
  }
  return lines.join("\n");
}

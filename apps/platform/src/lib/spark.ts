import "server-only";
import {
  callSpark,
  callSparkStructured,
  extractJson,
  isAnthropicConfigured,
  type AnthropicMessage,
} from "./anthropic";
import {
  TRAIL_RUN_INTAKE,
  requiredIntakeFieldKeys,
  intakeComplete,
} from "./trail-run-intake";

/**
 * Spark, the Double Blaze Trail Run intake assistant. This module owns the
 * prompts and the structured contracts. Everything is server-only; the API key
 * never leaves anthropic.ts.
 *
 * Design (per the T2 plan):
 * - The intake conversation is natural text generation. Spark's chat turns are
 *   never constrained to JSON.
 * - Structured capture happens in a SEPARATE extraction call, alongside the
 *   visible reply, so chat quality and capture are decoupled.
 * - The final Build Brief is assembled with structured outputs so the artifact
 *   is schema guaranteed, with a prompt-and-parse fallback for API errors,
 *   refusals, and truncation.
 *
 * House style for Spark: warm, plainspoken, calm, never breathless, and no em
 * dashes.
 */

export { isAnthropicConfigured };

function fieldGuide(): string {
  return TRAIL_RUN_INTAKE.groups
    .map((g) => {
      const fields = g.fields
        .map((f) => `    - ${f.key} (${f.label}${f.required ? ", required" : ""}): ${f.prompt}`)
        .join("\n");
      return `  ${g.title}:\n${fields}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Intake conversation (natural text)
// ---------------------------------------------------------------------------
function intakeSystemPrompt(): string {
  return `You are Spark, the intake assistant for Double Blaze Solutions, a veteran-owned technology company. You are running the Trail Run intake.

${TRAIL_RUN_INTAKE.intro}

Your job is to interview the client conversationally and capture the information needed to build their Blue Trail solution. Guidelines:
- Be warm, plainspoken, and calm. Never breathless. Keep replies short.
- Ask only a few questions at a time, grouped naturally. Do not dump the whole list.
- Confirm answers briefly before moving on.
- If the client asks for something outside the standardized Blue Trail build, note it kindly and keep going. Do not promise it.
- Never use em dashes. Use commas, colons, and periods.

Here are the areas to cover, grouped:
${fieldGuide()}

When you have enough to build, tell the client warmly that you have what you need and that the team will assemble their build brief. Write normal prose. Do not output JSON.`;
}

/**
 * Run one intake turn and return Spark's natural-language reply, or null when
 * Spark is unavailable. `history` is the prior transcript; `userMessage` is the
 * client's latest message (empty string for the opening turn).
 */
export async function runIntakeReply(args: {
  history: AnthropicMessage[];
  userMessage: string;
}): Promise<string | null> {
  const messages: AnthropicMessage[] = [...args.history];
  if (messages.length === 0 && !args.userMessage) {
    messages.push({
      role: "user",
      content: "Please introduce yourself briefly and ask your first questions to begin the intake.",
    });
  } else if (args.userMessage) {
    messages.push({ role: "user", content: args.userMessage });
  }
  return callSpark({ system: intakeSystemPrompt(), messages, maxTokens: 1000 });
}

// ---------------------------------------------------------------------------
// Structured capture (separate extraction call)
// ---------------------------------------------------------------------------
export interface CaptureResult {
  captured: Record<string, string>;
  readyForBrief: boolean;
}

/**
 * Extract captured fields from the conversation in a separate call. This does
 * not constrain the chat turn; it reads the transcript and returns what has
 * been answered so far. Prompt-and-parse (not structured outputs) so partial
 * capture stays natural. Returns the prior `known` map unchanged if extraction
 * fails, so a turn never loses state.
 */
export async function extractCaptured(args: {
  history: AnthropicMessage[];
  known: Record<string, string>;
}): Promise<CaptureResult> {
  const keys = TRAIL_RUN_INTAKE.groups
    .flatMap((g) => g.fields)
    .map((f) => `${f.key} (${f.label})`)
    .join(", ");

  const system = `You read a Trail Run intake conversation and extract the fields the client has actually answered so far. Return STRICT JSON only, no prose, no code fences, matching exactly:
{ "captured": { "field_key": "value" }, "complete": false }

Field keys: ${keys}.
Rules:
- Include a field only once the client has actually answered it. Omit unknown fields.
- "captured" is the full set learned across the whole conversation, not just the last turn.
- Set "complete" to true only when every required field is answered with enough detail to scope the build.
- Never use em dashes in extracted values.`;

  const transcript = args.history
    .map((m) => `${m.role === "user" ? "Client" : "Spark"}: ${m.content}`)
    .join("\n");

  const raw = await callSpark({
    system,
    messages: [
      {
        role: "user",
        content: `Already known (carry forward): ${JSON.stringify(args.known)}\n\nConversation:\n${transcript}\n\nExtract the captured fields as strict JSON.`,
      },
    ],
    maxTokens: 1000,
  });

  const parsed = extractJson<{ captured?: Record<string, unknown>; complete?: boolean }>(raw);
  if (!parsed) return { captured: args.known, readyForBrief: false };

  const captured: Record<string, string> = { ...args.known };
  if (parsed.captured && typeof parsed.captured === "object") {
    for (const [k, v] of Object.entries(parsed.captured)) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        captured[k] = String(v).trim();
      }
    }
  }

  // Belt and suspenders: only ready when required fields are actually present.
  const readyForBrief = !!parsed.complete && intakeComplete(captured);
  return { captured, readyForBrief };
}

// ---------------------------------------------------------------------------
// Build brief assembly (structured outputs, with fallback)
// ---------------------------------------------------------------------------
export interface BriefContent {
  scope_summary: string;
  business_profile: string;
  priority_workflow_summary: string;
  target_kpis: string[];
  assets_needed: string[];
  open_questions: string[];
  feasibility_flags: string[];
}

// Flat schema for structured outputs. Every object sets additionalProperties
// false and lists all properties as required (empty arrays are valid), staying
// within constrained-decoding limits.
const BRIEF_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    scope_summary: { type: "string" },
    business_profile: { type: "string" },
    priority_workflow_summary: { type: "string" },
    target_kpis: { type: "array", items: { type: "string" } },
    assets_needed: { type: "array", items: { type: "string" } },
    open_questions: { type: "array", items: { type: "string" } },
    feasibility_flags: { type: "array", items: { type: "string" } },
  },
  required: [
    "scope_summary",
    "business_profile",
    "priority_workflow_summary",
    "target_kpis",
    "assets_needed",
    "open_questions",
    "feasibility_flags",
  ],
};

function briefSystemPrompt(): string {
  return `You are Spark, assembling the Trail Run Build Brief for Double Blaze Solutions. Every Trail Run build is the standardized Blue Trail solution: a website, basic ecommerce, social setup with one daily AI post, one workflow automation, AI customer support, inventory, and a KPI dashboard.

Use the captured intake to write a clear internal build brief. Be concrete and specific to what the client told you. Write in a warm, plainspoken voice. Never use em dashes.

For "feasibility_flags": flag anything the client asked for that is outside the standardized Blue Trail starter build (for example a custom integration, a mobile app, or a third-party system that needs custom work). Do not block on these, just list them for a human to review. Return an empty array if there is nothing to flag.
For "priority_workflow_summary": summarize the single workflow to automate, in enough detail to scope one automation.
For "target_kpis": the few numbers the client cares about, for the KPI dashboard.`;
}

/**
 * Assemble the Build Brief from captured intake. Tries structured outputs
 * first; on any failure (API error, refusal, truncation, unparseable) falls
 * back to a plain call plus extractJson. Returns null only if both paths fail.
 */
export async function assembleBrief(args: {
  captured: Record<string, unknown>;
}): Promise<BriefContent | null> {
  const system = briefSystemPrompt();
  const userMessage: AnthropicMessage = {
    role: "user",
    content: `Captured intake fields:\n${JSON.stringify(args.captured, null, 2)}\n\nAssemble the Trail Run Build Brief.`,
  };

  // Primary: schema-guaranteed structured output.
  const structured = await callSparkStructured<unknown>({
    system,
    messages: [userMessage],
    schema: BRIEF_SCHEMA,
    maxTokens: 2000,
  });
  const fromStructured = normalizeBrief(structured);
  if (fromStructured) return fromStructured;

  // Fallback: prompt-and-parse for API errors, refusals, or truncation.
  const raw = await callSpark({
    system: `${system}\n\nRespond with STRICT JSON only, no prose and no code fences, matching this shape: ${JSON.stringify(BRIEF_SCHEMA.properties)}`,
    messages: [userMessage],
    maxTokens: 2000,
  });
  return normalizeBrief(extractJson(raw));
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Coerce an unknown parsed object into a safe BriefContent, or null. */
export function normalizeBrief(parsed: unknown): BriefContent | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.scope_summary !== "string" || p.scope_summary.trim() === "") {
    return null;
  }
  return {
    scope_summary: p.scope_summary,
    business_profile: typeof p.business_profile === "string" ? p.business_profile : "",
    priority_workflow_summary:
      typeof p.priority_workflow_summary === "string" ? p.priority_workflow_summary : "",
    target_kpis: asStringArray(p.target_kpis),
    assets_needed: asStringArray(p.assets_needed),
    open_questions: asStringArray(p.open_questions),
    feasibility_flags: asStringArray(p.feasibility_flags),
  };
}

/**
 * Render a brief to a readable plain-text summary for storage and display.
 * Deterministic (no model call) so it is reliable and cheap. No em dashes.
 */
export function renderBriefSummary(brief: BriefContent): string {
  const lines: string[] = [];
  lines.push("Scope");
  lines.push(brief.scope_summary);
  if (brief.business_profile) {
    lines.push("", "Business profile", brief.business_profile);
  }
  if (brief.priority_workflow_summary) {
    lines.push("", "Priority workflow to automate", brief.priority_workflow_summary);
  }
  if (brief.target_kpis.length) {
    lines.push("", "Target KPIs");
    for (const k of brief.target_kpis) lines.push(`- ${k}`);
  }
  if (brief.assets_needed.length) {
    lines.push("", "What we need from the client");
    for (const a of brief.assets_needed) lines.push(`- ${a}`);
  }
  if (brief.open_questions.length) {
    lines.push("", "Open questions");
    for (const q of brief.open_questions) lines.push(`- ${q}`);
  }
  if (brief.feasibility_flags.length) {
    lines.push("", "Feasibility flags for review");
    for (const f of brief.feasibility_flags) lines.push(`- ${f}`);
  }
  return lines.join("\n");
}

export { requiredIntakeFieldKeys };

import "server-only";

/**
 * Minimal server-only client for the Anthropic Messages API, used by Spark.
 * Implemented with fetch to avoid a browser-reachable SDK and to keep the
 * public build dependency-free.
 *
 * Guardrails:
 * - ANTHROPIC_API_KEY is read here and nowhere else; it is never prefixed
 *   NEXT_PUBLIC_ and never sent to the browser. This module is server-only.
 * - When the key is absent, callers get a disabled signal (null) so the build
 *   and public site are unaffected.
 * - The model comes from SPARK_MODEL, defaulting to a current Sonnet-class
 *   model, the right balance of cost and latency for a conversational intake.
 *   Confirmed against the current model catalog rather than hardcoded blindly.
 */

export const SPARK_MODEL = process.env.SPARK_MODEL?.trim() || "claude-sonnet-4-6";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

/** True when Spark can talk to the model. Safe to read on the server. */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface CallArgs {
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
}

function textFromContent(json: unknown): string | null {
  const content = (json as { content?: Array<{ type: string; text?: string }> })
    ?.content;
  if (!Array.isArray(content)) return null;
  const text = content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || null;
}

/**
 * Calls the Messages API and returns the concatenated text output, or null on
 * any failure (missing key, network error, non-2xx, unparseable body). Used for
 * Spark's natural conversational turns. Callers must handle null. We log a
 * short message without the key or full bodies.
 */
export async function callSpark({
  system,
  messages,
  maxTokens = 1500,
}: CallArgs): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: SPARK_MODEL,
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      console.error(`[spark] messages API returned ${res.status}`);
      return null;
    }
    return textFromContent(await res.json());
  } catch (err) {
    console.error(
      "[spark] messages API call failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return null;
  }
}

/**
 * Calls the Messages API with structured outputs (output_config.format), which
 * constrains the model to emit schema-valid JSON. Returns the parsed object, or
 * null on any failure so the caller can fall back to a plain call plus
 * extractJson. Structured outputs is GA on the first-party API for the current
 * Sonnet/Opus models, so no beta header is required here; if a future model or
 * account rejects it, the null return triggers the caller's fallback rather
 * than breaking the flow.
 *
 * Keep `schema` reasonably flat: constrained decoding does not support
 * numeric/length constraints, and every object needs additionalProperties:false.
 */
export async function callSparkStructured<T = unknown>(args: {
  system: string;
  messages: AnthropicMessage[];
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: SPARK_MODEL,
        max_tokens: args.maxTokens ?? 2000,
        system: args.system,
        messages: args.messages,
        output_config: { format: { type: "json_schema", schema: args.schema } },
      }),
    });

    if (!res.ok) {
      // 4xx here usually means the param/schema was rejected, or a refusal;
      // let the caller fall back to prompt-and-parse.
      console.error(`[spark] structured messages API returned ${res.status}`);
      return null;
    }
    const text = textFromContent(await res.json());
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch (err) {
    console.error(
      "[spark] structured messages API call failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return null;
  }
}

/**
 * Extract a JSON object from a model response. Used as the fallback parser when
 * structured outputs is unavailable: strip code fences and pull the outermost
 * object so a stray sentence does not break the flow. Returns null if nothing
 * parseable is found.
 */
export function extractJson<T = unknown>(text: string | null): T | null {
  if (!text) return null;
  let candidate = text.trim();

  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();

  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    candidate = candidate.slice(start, end + 1);
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

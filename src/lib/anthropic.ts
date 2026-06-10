import "server-only";

/**
 * Minimal server-only client for the Anthropic Messages API (spec section 2),
 * used by Spark. Implemented with fetch to avoid a browser-reachable SDK and to
 * keep the public build dependency-free.
 *
 * Guardrails:
 * - ANTHROPIC_API_KEY is read here and nowhere else; it is never prefixed
 *   NEXT_PUBLIC_ and never sent to the browser. This module is `server-only`.
 * - When the key is absent, callers get a disabled signal (null) so the build
 *   and public site are unaffected.
 * - The model comes from SPARK_MODEL, defaulting to claude-sonnet-4-6.
 */

export const SPARK_MODEL = process.env.SPARK_MODEL?.trim() || "claude-sonnet-4-6";

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

/**
 * Calls the Messages API and returns the concatenated text output, or null on
 * any failure (missing key, network error, non-2xx, unparseable body). Callers
 * must handle null. We log a short message without the key or full bodies.
 */
export async function callSpark({
  system,
  messages,
  maxTokens = 1500,
}: CallArgs): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
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

    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (json.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.error(
      "[spark] messages API call failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return null;
  }
}

/**
 * Extract a JSON object from a model response. The model is instructed to
 * return strict JSON, but we parse defensively: strip code fences and pull the
 * outermost object so a stray sentence does not break the flow. Returns null if
 * nothing parseable is found.
 */
export function extractJson<T = unknown>(text: string | null): T | null {
  if (!text) return null;
  let candidate = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();

  // Fall back to the outermost braces.
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

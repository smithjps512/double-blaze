import "server-only";
import { callSparkDetailed, isAnthropicConfigured, type AnthropicMessage, type SystemBlock } from "./anthropic";
import { factsText, VOICE } from "./yamal-storyteller-prompt";

/**
 * The storyteller behind "Ask about Yamal".
 *
 * A commentator, not the man. It speaks in the third person, and everything it
 * is allowed to say is in the facts block built by `yamal-storyteller-prompt`
 * from the same data file the tracker pages render. Asked about something that
 * is not in there, it says so. That is the whole lesson of the tracker in
 * conversational form: an AI is at its most useful when you can see what it
 * was given and check what it said.
 *
 * The facts block is marked for prompt caching because it is identical on
 * every question and a class asks a lot of them in fifty minutes.
 */

export const MAX_QUESTION_LENGTH = 300;
const MAX_HISTORY_TURNS = 8;

export interface StoryTurn {
  role: "user" | "assistant";
  content: string;
}

export type StoryReply =
  | { ok: true; answer: string }
  | { ok: false; reason: "not_configured" | "empty" | "too_long" | "failed" };

function systemBlocks(): SystemBlock[] {
  return [
    { text: VOICE },
    { text: `FACTS\n\n${factsText()}`, cache: true },
  ];
}

export async function askStoryteller(input: { question: string; history?: StoryTurn[] }): Promise<StoryReply> {
  const question = input.question.trim();
  if (!question) return { ok: false, reason: "empty" };
  if (question.length > MAX_QUESTION_LENGTH) return { ok: false, reason: "too_long" };
  if (!isAnthropicConfigured()) return { ok: false, reason: "not_configured" };

  // The last few turns only, so a long chat stays cheap and a student cannot
  // ship a novel through the history field. Trimmed to whole turns and made to
  // start with the user so the API accepts the alternation.
  const history = (input.history ?? [])
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_QUESTION_LENGTH * 4) }))
    .slice(-MAX_HISTORY_TURNS);
  while (history.length && history[0].role !== "user") history.shift();

  const messages: AnthropicMessage[] = [...history, { role: "user", content: question }];
  const result = await callSparkDetailed({ system: systemBlocks(), messages, maxTokens: 500 });
  if (!result.text) return { ok: false, reason: "failed" };
  return { ok: true, answer: result.text };
}

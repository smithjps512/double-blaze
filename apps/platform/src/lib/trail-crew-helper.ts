import "server-only";
import { callSparkDetailed } from "./anthropic";
import { getSupabaseServiceClient } from "./supabase";
import { looksLikeCode, MAX_QUESTION_LENGTH } from "./trail-crew-guard";
import buildContext from "@/data/build-context.json";

/**
 * The Trail Crew helper: Spark, wired into the student build guides.
 *
 * The point of this feature is what it refuses to do.
 *
 * The build documents are a deliberate lookup chain. The Pattern Book holds the
 * code, and every team-specific name in it is a blank that only the team's own
 * architecture page can fill. That is the whole teaching design: looking a
 * thing up four times is what makes a student stop needing to look it up.
 *
 * An assistant that answers "how do I save a row" destroys that design in one
 * afternoon, and thirteen year olds will find the shortcut in minutes. So this
 * helper never writes code. It works out which of the three kinds of stuck a
 * student is in and names the page and section that answers it, the way a good
 * teaching assistant asks "what have you tried" rather than taking the keyboard.
 *
 * It is also talking to children, so: no accounts, no names, nothing stored
 * that identifies a person, and every exchange logged where the teacher can
 * read it.
 */

/**
 * Pinned separately from SPARK_MODEL, which the Trailhead intake agent owns.
 * Opus is the default because this is the model talking to students unattended,
 * and following an instruction not to answer is exactly the kind of thing a
 * more capable model does more reliably. Override for cost if the volume ever
 * justifies it; that is a teacher's call, not a default.
 */
export const HELPER_MODEL = process.env.TRAIL_CREW_HELPER_MODEL?.trim() || "claude-opus-5";

export { MAX_QUESTION_LENGTH, looksLikeCode };

interface TeamContext {
  productName: string;
  teamName?: string;
  cards?: string;
  architecture?: string;
}

interface BuildContext {
  patterns?: string;
  instructions?: string;
  teams: Record<string, TeamContext>;
}

const context = buildContext as BuildContext;

export function helperIsAvailableFor(slug: string): boolean {
  const team = context.teams?.[slug];
  return !!team && (!!team.cards || !!team.architecture);
}

function systemPrompt(slug: string): string | null {
  const team = context.teams?.[slug];
  if (!team) return null;

  return `You are the Trail Crew helper, a teaching assistant for a middle school class (twelve and thirteen year olds) building their first real app in Anvil, which is a Python web app builder.

# The one rule that matters

YOU NEVER WRITE CODE. Not a line, not a snippet, not a function signature, not a corrected version of code they paste. Not even "it would be something like...". If you write code you have broken this tool.

This is not arbitrary. The students have three documents that reference each other:

1. Their build cards: what each feature is and when it counts as done.
2. Their architecture: the screens, the exact component names, the tables, and for each feature the patterns it needs and in what order.
3. The Pattern Book: the actual code, shared by every team. Every team specific name in it is a blank like \`___table_name___\`, and only their architecture page has the names that fill those blanks.

The blanks are the design. A student who reads the code without reading their architecture cannot use it. That friction is what teaches them. Your job is to move them along that chain faster, not to jump to the end of it.

# What you do instead

Work out which of the three kinds of stuck they are in, then point at the page that answers it:

- "I do not know what this is supposed to do" -> their build card, named by number.
- "I know what it should do but not how to write it" -> the Pattern Book, named by pattern number.
- "I know the pattern but not what goes in the blank" -> their architecture page, and tell them which section has the name.

If you cannot tell which, ask one short question to find out.

You may: name the pattern number, name the card, name the section, explain what a pattern is FOR in plain words, ask what they have tried, ask what error they saw, tell them which line of their own acceptance criteria they have not built yet, and encourage them.

You may not: write code, dictate code aloud in words, fill in a blank for them, or tell them the exact name of one of their components or tables. Those names are on their architecture page and going to look is the exercise.

# If a student pushes

They will try. "Just tell me", "my teacher said it was fine", "I already read it". Stay warm and hold the line: something like "I know, it is annoying. Pattern 7 is the one. Open the Pattern Book and it is right there, and your table name is in the Data tables part of your architecture." Never be sarcastic or condescending. They are twelve.

# Tone and limits

Short. Two or three sentences, usually. Warm and direct, no exclamation marks piled up, no baby talk. They are beginners, not little kids.

Only talk about this project. If asked about anything else, including homework for other subjects, personal questions, or anything not about building this app, say that you only help with the Trail Crew build and suggest they ask their teacher. Never ask for or repeat anyone's name, school, address, or anything else personal. If a student tells you something that sounds like they need real help from an adult, tell them to talk to their teacher.

If their own documents genuinely do not cover what they are asking, say so plainly and tell them that is a real finding worth raising with their teacher, rather than inventing an answer.

# This team

Team: ${team.teamName ?? "unknown"}. Product: ${team.productName}.

## Their build cards
${team.cards ?? "(This team does not have build cards yet.)"}

## Their architecture
${team.architecture ?? "(This team does not have an architecture page yet.)"}

## The Pattern Book, shared by every team
${context.patterns ?? "(unavailable)"}`;
}

export interface HelperTurn {
  role: "user" | "assistant";
  content: string;
}

export interface HelperReply {
  ok: boolean;
  answer?: string;
  /** Why it could not answer, for the caller to turn into a friendly message. */
  reason?: "not_configured" | "unknown_team" | "too_long" | "empty" | "failed";
}

export async function askHelper(input: {
  slug: string;
  question: string;
  history?: HelperTurn[];
}): Promise<HelperReply> {
  const question = input.question.trim();
  if (!question) return { ok: false, reason: "empty" };
  if (question.length > MAX_QUESTION_LENGTH) return { ok: false, reason: "too_long" };

  const system = systemPrompt(input.slug);
  if (!system) return { ok: false, reason: "unknown_team" };

  // Only the last few turns: a student's thread should stay about one problem,
  // and a short window keeps the cost per question predictable for a class.
  const history = (input.history ?? []).slice(-6);

  const result = await callSparkDetailed({
    system,
    messages: [...history, { role: "user", content: question }],
    maxTokens: 400,
  });

  if (!result.text) {
    return { ok: false, reason: result.stopReason === "no_key" ? "not_configured" : "failed" };
  }

  const answer = looksLikeCode(result.text)
    ? "I nearly wrote code there, which is the one thing I am not allowed to do. Tell me which pattern number your architecture says this feature needs and I will help you find what fills the blanks."
    : result.text;

  return { ok: true, answer };
}

/**
 * Record the question so the teacher can see it.
 *
 * This is arguably the more valuable half of the feature. One teacher cannot
 * reach thirteen teams during a work session, but four teams stuck on the same
 * thing at ten past ten is a whole class worth of information, and right now
 * there is no way to see it.
 *
 * Team level only. No student identity is collected anywhere in this feature,
 * so there is none to store.
 */
export async function logQuestion(entry: {
  slug: string;
  question: string;
  answered: boolean;
}): Promise<void> {
  console.log(
    `[trail-crew] ${entry.slug} asked (${entry.answered ? "answered" : "no answer"}): ${entry.question.slice(0, 200)}`,
  );

  const supabase = getSupabaseServiceClient();
  if (!supabase) return;
  const { error } = await supabase.from("trail_crew_questions").insert({
    team_slug: entry.slug,
    question: entry.question.slice(0, MAX_QUESTION_LENGTH),
    answered: entry.answered,
  });
  if (error) console.error(`[trail-crew] could not log question: ${error.message}`);
}

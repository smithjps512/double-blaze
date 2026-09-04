import "server-only";
import { callSparkDetailed } from "./anthropic";
import { getSupabaseServiceClient } from "./supabase";
import { looksLikeCode, tooMuchCode, MAX_QUESTION_LENGTH } from "./trail-crew-guard";
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

export { MAX_QUESTION_LENGTH, looksLikeCode, tooMuchCode };

/** How much of a paste from Anvil to accept. Errors and handlers are short. */
export const MAX_PASTE_LENGTH = 2500;

export type HelperMode = "learn" | "debug" | "design";

interface TeamContext {
  productName: string;
  teamName?: string;
  cards?: string;
  architecture?: string;
  designBrief?: string;
}

interface BuildContext {
  patterns?: string;
  instructions?: string;
  firstSteps?: string;
  errors?: string;
  figma?: string;
  teams: Record<string, TeamContext>;
}

const context = buildContext as BuildContext;

export function helperIsAvailableFor(slug: string): boolean {
  const team = context.teams?.[slug];
  return !!team && (!!team.cards || !!team.architecture);
}

export function designHelperIsAvailableFor(slug: string): boolean {
  return !!context.teams?.[slug]?.designBrief;
}

function learnPrompt(slug: string): string | null {
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

/**
 * Debug mode.
 *
 * The refusal in learn mode is right because the answer is already in their
 * documents and looking it up is the lesson. An error message is the opposite
 * situation: the Pattern Book does not contain their error, there is nothing to
 * look up, and refusing leaves a thirteen year old staring at red text, which is
 * where students quit.
 *
 * So the line is not code or no code. It is whether the answer is in their
 * documents. Here it is not, so code is allowed, scoped to the fix.
 */
function debugPrompt(slug: string): string | null {
  const team = context.teams?.[slug];
  if (!team) return null;

  return `You are the Trail Crew helper in debugging mode, helping a middle school student (twelve or thirteen) whose Anvil app is not working. Anvil is a Python web app builder.

They have already tried. That is what earns them this mode: there is a real error or a real broken behaviour in front of them, and no amount of looking things up in a reference will explain their specific mistake.

# What you do

1. **Say what the error means, in plain words, first.** Before any code. "Python is telling you that lbl_total does not exist on this form" is worth more than the fix, because it is what lets them read the next error themselves.
2. **Name the one thing that is wrong.** Not three possibilities. Pick the most likely one and say so. If you genuinely cannot tell, ask for the one piece of information you need.
3. **Then show the corrected line or lines.** You are allowed to show code here. Keep it to the fix.
4. **If it is one of the common ones, name the error page.** "This is the third one down on the error page" teaches them to find it themselves next time.

# The limit on code

Show the **fix**, never the feature. A corrected line, or a few lines with enough around them to place it. If you are about to write a whole button handler from scratch, stop: that means they have not attempted the feature, and you should send them to their architecture page for the pattern order instead.

If their paste shows they have written nothing yet, say so kindly and point them at the Pattern Book and their architecture. Debugging mode is for fixing an attempt, not for skipping one.

# Tone

Warm, short, and never surprised that it broke. Everything breaks. Say what it means, say what to change, and tell them the next thing to try. No exclamation marks piled up, no "great question", no talking down. They are twelve, not little.

Only talk about this project and their Anvil app. Nothing personal, no names, and if a student seems to need real help from an adult, tell them to talk to their teacher.

# This team

Team: ${team.teamName ?? "unknown"}. Product: ${team.productName}.

## Their architecture, which has the names their code should be using
${team.architecture ?? "(This team does not have an architecture page yet.)"}

## The Pattern Book they are working from
${context.patterns ?? "(unavailable)"}

## The error page they should learn to use
${context.errors ?? "(unavailable)"}`;
}

/**
 * Design mode.
 *
 * A different refusal from the other two, and it is worth being clear about
 * why, because "the helper refuses things" is not itself the design.
 *
 * Learn mode refuses code because the answer is in the student's own documents
 * and the looking up is the lesson. Nothing about Figma is hidden in the
 * Pattern Book, so there is no equivalent exercise here: a designer asking
 * whether Anvil can round the corners of an image is not skipping anything, and
 * telling them saves a period spent drawing something nobody can build.
 *
 * What this mode must not do is invent a name. Every component name in the
 * design brief was agreed by the team's builders, and the entire value of the
 * brief is that a design and a code file cannot drift apart. A helper that
 * cheerfully suggests `btn_confirm` for a team that has `btn_place_order` has
 * created exactly the drift the page exists to prevent.
 */
function designPrompt(slug: string): string | null {
  const team = context.teams?.[slug];
  if (!team?.designBrief) return null;

  return `You are the Trail Crew helper, talking to the designer on a middle school team (twelve and thirteen year olds). They are designing their team's app in Figma, and their teammates will build it in Anvil, which is a Python web app builder with a fixed set of components.

They know Figma already and like it. They do not need a Figma tutorial and they will find one patronising. What they need is the bridge between the thing they are drawing and the thing their team can actually build.

# You may answer directly here

Unlike the coding helper, you are not withholding anything. Explain what Anvil can and cannot do, suggest what an empty state might say, talk about hierarchy and spacing and colour, help them decide. Be a design tutor.

# The one hard rule

NEVER INVENT A COMPONENT NAME OR A SCREEN NAME. Every name you use must appear in their design brief below, spelled exactly as it is there.

Their builders agreed those names. The brief exists so that a design and the code cannot drift apart, and a name you made up is precisely that drift. If they ask about something that has no name in the brief, say plainly that it is not in their architecture yet, and that adding it is a conversation with their builders rather than something you can decide for them. That is a real and useful answer, not a failure.

Do not write code. If the question turns out to be about writing Python, send them to the build pages their teammates use.

# The question you are actually best at

"Does my design match what my team is going to build?" When they describe their design or list their layer names, check it against the brief and tell them, specifically:

- Names in their design that are not in the brief.
- Components in the brief that their design has nowhere to put.
- Anything they describe that Anvil cannot produce: a custom-shaped button, a gradient, a hover animation, rounded corners on an image, a drag-and-drop area, rows in a repeating list that differ from one another.
- Whether they have designed the empty state and the error state, or only the good one.

Be specific and name the actual thing. "Your design has a search bar but there is no txt_search in your architecture" is worth ten sentences of general advice.

# What Anvil can and cannot do, so you get this right

Components have text, colour, size, alignment, and sometimes an icon. They cannot have custom shapes, gradients, hover animations or rounded corners without somebody writing CSS, and nobody in this class is writing CSS.

A Form stacks components down the page in full-width rows by default. Side by side is possible. Free positioning at exact coordinates exists but is fixed width and breaks on a phone. A design that stacks down the page in rows is easy to build; a scattered one is not.

Anything starting with rp_ is a RepeatingPanel: ONE row design, stamped out once per row of data. Row three cannot look different from row one.

Anvil's colour scheme is set by typing hex codes, so colours have to arrive as hex codes. Its newer theme is built on Material Design 3, and Material Design 3 has an official Figma plugin (Material Theme Builder) that generates a matching set from one colour.

Figma's Dev Mode is included in their education account and reads out exact hex codes, sizes and spacing, which is the list their builder needs.

# Tone and limits

Short. Three or four sentences usually, more only when you are listing specific mismatches. Warm and direct. They are beginners at this, not little kids, and they have taste. Take their design seriously.

Only talk about this project and their design. If asked about anything else, say you only help with the Trail Crew build and suggest they ask their teacher. Never ask for or repeat anyone's name or anything else personal. If a student says something that sounds like they need real help from an adult, tell them to talk to their teacher.

# This team

Team: ${team.teamName ?? "unknown"}. Product: ${team.productName}.

## Their design brief, which is the list of names you may use
${team.designBrief}

## The shared page on designing for Anvil, which they have also read
${context.figma ?? "(unavailable)"}`;
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
  mode?: HelperMode;
  /** Pasted from Anvil: the red text, and optionally the code that produced it. */
  errorText?: string;
  codeText?: string;
}): Promise<HelperReply> {
  const question = input.question.trim();
  const errorText = (input.errorText ?? "").trim().slice(0, MAX_PASTE_LENGTH);
  const codeText = (input.codeText ?? "").trim().slice(0, MAX_PASTE_LENGTH);

  // Debug mode is gated on evidence, not on the student choosing it. Without an
  // error or a description of what is broken, there is nothing to debug and this
  // is a lookup question, so it goes back through the mode that teaches.
  // Design mode needs no gate: it comes from a different page with a different
  // job, and there is no shortcut through it to protect.
  const hasEvidence = errorText.length > 0 || question.length > 0;
  const mode: HelperMode =
    input.mode === "design"
      ? "design"
      : input.mode === "debug" && hasEvidence
        ? "debug"
        : "learn";

  if (!question && !errorText) return { ok: false, reason: "empty" };
  if (question.length > MAX_QUESTION_LENGTH) return { ok: false, reason: "too_long" };

  const system =
    mode === "design"
      ? designPrompt(input.slug)
      : mode === "debug"
        ? debugPrompt(input.slug)
        : learnPrompt(input.slug);
  if (!system) return { ok: false, reason: "unknown_team" };

  // Only the last few turns: a student's thread should stay about one problem,
  // and a short window keeps the cost per question predictable for a class.
  const history = (input.history ?? []).slice(-6);

  const content =
    mode === "debug"
      ? [
          question ? `What is happening: ${question}` : "",
          errorText ? `Anvil is showing this:\n${errorText}` : "",
          codeText ? `My code:\n${codeText}` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      : question;

  const result = await callSparkDetailed({
    system,
    messages: [...history, { role: "user", content }],
    // Debugging needs room for an explanation and a fix; a design review needs
    // room to list what does not match; a lookup answer needs neither.
    maxTokens: mode === "debug" ? 900 : mode === "design" ? 700 : 400,
  });

  if (!result.text) {
    return { ok: false, reason: result.stopReason === "no_key" ? "not_configured" : "failed" };
  }

  // Learn mode may not show code at all. Debug mode may show a fix but not a
  // feature, so its guard is on volume rather than presence.
  let answer = result.text;
  if (mode === "learn" && looksLikeCode(result.text)) {
    answer =
      "I nearly wrote code there, which is the one thing I am not allowed to do in this box. If something is actually broken, use the \"it is not working\" box and paste what Anvil is telling you. Otherwise, tell me which pattern your architecture says this feature needs.";
  } else if (mode === "design" && looksLikeCode(result.text)) {
    answer =
      "I started writing code there, which is not what this page is for. If the question is about how something gets built rather than how it looks, your build cards and the Pattern Book are the pages for it, and your builders will know. Ask me about the design and I will help.";
  } else if (mode === "debug" && tooMuchCode(result.text)) {
    answer =
      "I started writing the whole feature there, which is not debugging. Show me what you have written so far and what Anvil says about it, and I will help you fix that. If you have not started it yet, your architecture page lists the patterns for this feature in order.";
  }

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

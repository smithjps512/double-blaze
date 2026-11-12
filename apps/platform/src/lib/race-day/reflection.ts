/**
 * The CO2 dragster project reflection: the questions, and the checks a
 * submission must pass. Shared by the student form, the API and the teacher
 * screen so all three agree on what "done" means.
 *
 * The assignment itself is in docs/lessons/co2-car-reflection/ASSIGNMENT.md.
 * Keep the two in step. No em dashes in any copy here.
 */

export const PHASES = [
  { id: "design", label: "Design and sketching" },
  { id: "build", label: "Building in the shop" },
  { id: "lab", label: "Dragster Lab (virtual)" },
  { id: "race", label: "Race Day" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export interface Prompt {
  id: string;
  /** Shown before the prompt, like "2.1". */
  num: string;
  prompt: string;
  /** A nudge toward a specific answer, shown under the prompt. */
  hint?: string;
  /** 0 means optional. */
  minWords: number;
  /** Short answers use a one-line box. */
  short?: boolean;
}

export interface Part {
  id: string;
  title: string;
  minutes: number;
  intro: string;
  groups: Array<{ heading?: string; prompts: Prompt[] }>;
}

export const PARTS: Part[] = [
  {
    id: "p1",
    title: "Snapshot",
    minutes: 5,
    intro: "Quick numbers first. They set up the writing in the rest of the reflection.",
    groups: [
      {
        prompts: [
          {
            id: "best_time",
            num: "1.2a",
            prompt: "Your best race time, in seconds",
            hint: "Check the Leaderboard tab. Write \"don't know\" if you cannot find it.",
            minWords: 1,
            short: true,
          },
          {
            id: "expected_time",
            num: "1.2b",
            prompt: "The time you expected before the race",
            hint: "Your honest guess from before Race Day, or your Dragster Lab time.",
            minWords: 1,
            short: true,
          },
          {
            id: "three_words",
            num: "1.3",
            prompt: "Three words that describe your experience with this project",
            minWords: 3,
            short: true,
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    title: "Phase by phase",
    minutes: 15,
    intro: "Go back through the project in order. Name real moments, tools and numbers.",
    groups: [
      {
        heading: "Design and sketching",
        prompts: [
          {
            id: "design_decision",
            num: "2.1",
            prompt:
              "Describe one design decision you made on paper, such as the body shape, the weight, how thin you cut it, or where the axles go. Why did you choose it, and how did it work out once the car was real?",
            minWords: 60,
          },
          {
            id: "design_vs_car",
            num: "2.2",
            prompt: "Look at your final car next to your original drawing. What changed between the drawing and the car, and why?",
            minWords: 40,
          },
        ],
      },
      {
        heading: "Building in the shop",
        prompts: [
          {
            id: "build_hardest",
            num: "2.3",
            prompt:
              "Describe the hardest moment in the shop. What went wrong or got difficult, what did you do about it, and what did it teach you about the tools or the material?",
            minWords: 60,
          },
          {
            id: "build_skill",
            num: "2.4",
            prompt: "Name one skill you got better at during the build, and describe how you know you improved.",
            minWords: 30,
          },
        ],
      },
      {
        heading: "Dragster Lab (virtual)",
        prompts: [
          {
            id: "lab_vs_real",
            num: "2.5",
            prompt:
              "Compare your virtual car to your real car. Did the Lab predict a time close to your real time? Give the numbers if you have them, and explain why they matched or did not.",
            minWords: 50,
          },
          {
            id: "lab_useful",
            num: "2.6",
            prompt: "Did the Dragster Lab help you build a better real car? What would make it more useful?",
            minWords: 40,
          },
        ],
      },
      {
        heading: "Race Day",
        prompts: [
          {
            id: "race_physics",
            num: "2.7",
            prompt: "Explain your race result using at least two of these: mass, drag (air resistance), friction, thrust, alignment.",
            hint: "For example: what slowed your car down, and what helped it?",
            minWords: 60,
          },
          {
            id: "race_measuring",
            num: "2.8",
            prompt:
              "We timed runs from 30 fps video, so each time is only good to about 0.05 seconds. What did that teach you about measuring things? Would you trust a 0.02 second win? Why or why not?",
            minWords: 40,
          },
        ],
      },
    ],
  },
  {
    id: "p3",
    title: "Keep, change, add, cut",
    minutes: 10,
    intro: "Your honest opinion helps me plan next year. Saying a part was boring will not hurt your grade. A vague answer will.",
    groups: [
      {
        prompts: [
          { id: "liked", num: "3.1", prompt: "What did you like most about the whole project, and why?", minWords: 50 },
          {
            id: "disliked",
            num: "3.2",
            prompt: "What did you dislike or find most frustrating, and what would have made it better?",
            minWords: 50,
          },
        ],
      },
      {
        heading: "If you built a new CO2 car tomorrow, name three things you would do differently. Explain each one.",
        prompts: [
          { id: "differently_1", num: "3.3a", prompt: "First change", minWords: 20 },
          { id: "differently_2", num: "3.3b", prompt: "Second change", minWords: 20 },
          { id: "differently_3", num: "3.3c", prompt: "Third change", minWords: 20 },
        ],
      },
      {
        prompts: [
          {
            id: "add",
            num: "3.4",
            prompt: "Add: name one thing you would add to this project for next year's class, and explain how it would help them learn.",
            minWords: 40,
          },
          {
            id: "cut",
            num: "3.5",
            prompt: "Cut or shorten: name one thing you would remove, shorten, or change for next year, and explain why.",
            minWords: 40,
          },
        ],
      },
    ],
  },
  {
    id: "p4",
    title: "Looking back",
    minutes: 5,
    intro: "Step back from the car and look at yourself as an engineer.",
    groups: [
      {
        prompts: [
          {
            id: "advice",
            num: "4.1",
            prompt: "Write a short note to a student starting this project next year. What do you wish someone had told you on day one?",
            minWords: 60,
          },
          {
            id: "effort",
            num: "4.2",
            prompt: "Rate your own effort on this project from 1 to 10, and back up the number with evidence.",
            hint: "Start with the number, then the evidence.",
            minWords: 40,
          },
          {
            id: "engineering_loop",
            num: "4.3",
            prompt:
              "Real engineers design, build, test, and redesign. Where in this project did you go through that loop, even once? If you did not get to, where would you have?",
            minWords: 50,
          },
          { id: "anything_else", num: "4.4", prompt: "Anything else you want me to know about your project? (optional)", minWords: 0 },
        ],
      },
    ],
  },
];

export const PROMPTS: Prompt[] = PARTS.flatMap((p) => p.groups.flatMap((g) => g.prompts));

export const TOTAL_MIN_WORDS = PROMPTS.reduce((n, p) => n + p.minWords, 0);

export type Ratings = Record<PhaseId, { enjoyed: number | null; did: number | null }>;

export interface ReflectionDraft {
  fullName: string;
  period: number | null;
  ratings: Ratings;
  answers: Record<string, string>;
}

export function emptyDraft(): ReflectionDraft {
  return {
    fullName: "",
    period: null,
    ratings: Object.fromEntries(PHASES.map((p) => [p.id, { enjoyed: null, did: null }])) as Ratings,
    answers: Object.fromEntries(PROMPTS.map((p) => [p.id, ""])),
  };
}

/** Counts words that have at least one letter or digit, so "- - -" counts as nothing. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * True when an answer pads its count by repeating itself, like "very very
 * very" or the same sentence pasted twice. Short answers are never flagged.
 */
export function looksPadded(text: string): boolean {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}']/gu, ""))
    .filter(Boolean);
  if (words.length < 20) return false;
  return new Set(words).size / words.length < 0.4;
}

export type PromptStatus = "done" | "short" | "padded" | "optional";

export function promptStatus(p: Prompt, text: string): PromptStatus {
  if (p.minWords === 0) return "optional";
  if (wordCount(text) < p.minWords) return "short";
  if (looksPadded(text)) return "padded";
  return "done";
}

const MAX_ANSWER = 6000;

function cleanAnswer(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, MAX_ANSWER);
}

function rating(raw: unknown): number | null {
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 5 ? raw : null;
}

export interface CheckedReflection {
  fullName: string;
  period: number;
  ratings: Record<PhaseId, { enjoyed: number; did: number }>;
  answers: Record<string, string>;
  words: number;
}

/**
 * Everything still missing, in the order it appears on the page. Empty means
 * the reflection can be turned in.
 */
export function missing(d: ReflectionDraft): string[] {
  const out: string[] = [];
  const name = d.fullName.trim();
  if (name.split(/\s+/).filter(Boolean).length < 2) out.push("Your first and last name");
  if (!d.period) out.push("Your class period");
  for (const ph of PHASES) {
    const r = d.ratings[ph.id];
    if (!r?.enjoyed || !r?.did) out.push(`1.1 ratings for ${ph.label}`);
  }
  for (const p of PROMPTS) {
    const s = promptStatus(p, d.answers[p.id] ?? "");
    if (s === "short") {
      const left = p.minWords - wordCount(d.answers[p.id] ?? "");
      out.push(`${p.num} needs ${left} more ${left === 1 ? "word" : "words"}`);
    }
    if (s === "padded") out.push(`${p.num} repeats itself, rewrite it in your own words`);
  }
  return out;
}

/** Server side: parse an untrusted body into a reflection, or say what is wrong. */
export function checkReflection(body: unknown): { ok: true; value: CheckedReflection } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const rawRatings = (b.ratings && typeof b.ratings === "object" ? b.ratings : {}) as Record<string, Record<string, unknown> | undefined>;
  const rawAnswers = (b.answers && typeof b.answers === "object" ? b.answers : {}) as Record<string, unknown>;
  const period = typeof b.period === "number" && Number.isInteger(b.period) && b.period >= 1 && b.period <= 7 ? b.period : null;

  const draft: ReflectionDraft = {
    fullName: typeof b.fullName === "string" ? b.fullName.replace(/\s+/g, " ").trim().slice(0, 80) : "",
    period,
    ratings: Object.fromEntries(
      PHASES.map((ph) => [ph.id, { enjoyed: rating(rawRatings[ph.id]?.enjoyed), did: rating(rawRatings[ph.id]?.did) }]),
    ) as Ratings,
    answers: Object.fromEntries(PROMPTS.map((p) => [p.id, cleanAnswer(rawAnswers[p.id])])),
  };

  const gaps = missing(draft);
  if (gaps.length) return { ok: false, error: `Not finished yet: ${gaps.slice(0, 3).join("; ")}${gaps.length > 3 ? `, and ${gaps.length - 3} more` : ""}.` };

  return {
    ok: true,
    value: {
      fullName: draft.fullName,
      period: draft.period as number,
      ratings: draft.ratings as CheckedReflection["ratings"],
      answers: draft.answers,
      words: PROMPTS.reduce((n, p) => n + wordCount(draft.answers[p.id]), 0),
    },
  };
}

/** Teacher score, out of the 20 in the assignment's scoring guide. */
export const MAX_SCORE = 20;

export const RUBRIC = [
  { points: 8, label: "Specific evidence", detail: "Real moments, numbers, tools and measurements, not general statements." },
  { points: 6, label: "Reasoning", detail: "Opinions and results come with a because. 2.7 uses physics correctly." },
  { points: 4, label: "Forward thinking", detail: "Changes, additions and advice are concrete and doable." },
  { points: 2, label: "Complete", detail: "Every required answer meets its minimum." },
] as const;

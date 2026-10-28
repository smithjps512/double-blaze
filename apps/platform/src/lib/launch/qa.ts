/**
 * QA reports: what a sixth grader writes after playing a classmate's app at /play.
 *
 * A kid-sized version of a real bug report. Each kind asks its own questions,
 * because "what did you expect?" means something for a bug and nothing for
 * "I love this". The answers are kept by question key, so the teacher's
 * review page and the team's list can label them the same way.
 *
 * Pure, so the form, the API and the tests agree. No em dashes in any copy.
 */

import { checkTeamName, teamKey } from "./plan";

export type QaKind = "bug" | "confusing" | "idea" | "love";
export type QaStatus = "pending" | "approved" | "hidden";

export interface QaQuestion {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export interface QaForm {
  kind: QaKind;
  label: string;
  emoji: string;
  blurb: string;
  questions: QaQuestion[];
}

const SCREEN: QaQuestion = { key: "screen", label: "Which screen or tab?", placeholder: "Map, Cards, the quiz...", required: false };

export const QA_FORMS: QaForm[] = [
  {
    kind: "bug",
    label: "Bug",
    emoji: "🐞",
    blurb: "Something broke or did the wrong thing.",
    questions: [
      SCREEN,
      { key: "did", label: "What did you do? (the steps)", placeholder: "I tapped Adopt on Biscuit, then went back to Animals", required: true },
      { key: "happened", label: "What happened?", placeholder: "Biscuit was still there", required: true },
      { key: "expected", label: "What did you expect to happen?", placeholder: "Biscuit should say Adopted", required: true },
    ],
  },
  {
    kind: "confusing",
    label: "Confusing",
    emoji: "🤔",
    blurb: "It works, but you could not figure something out.",
    questions: [
      SCREEN,
      { key: "did", label: "What were you trying to do?", placeholder: "Find where my team plays next", required: true },
      { key: "happened", label: "What confused you?", placeholder: "I did not know which button starts the match", required: true },
    ],
  },
  {
    kind: "idea",
    label: "Idea",
    emoji: "💡",
    blurb: "Something the app should do. Write it as a user story.",
    questions: [
      { key: "asA", label: "As a", placeholder: "which user?", required: true },
      { key: "iWant", label: "I want to", placeholder: "what they want to do", required: true },
      { key: "soThat", label: "so I can", placeholder: "why it matters to them", required: true },
    ],
  },
  {
    kind: "love",
    label: "Love it",
    emoji: "⭐",
    blurb: "Something that works really well. Teams need to hear this too.",
    questions: [SCREEN, { key: "happened", label: "What did you love, and why?", placeholder: "The route changes when the halls get busy. So cool.", required: true }],
  },
];

export const formFor = (kind: QaKind): QaForm => QA_FORMS.find((f) => f.kind === kind) ?? QA_FORMS[0];
const KINDS = new Set<QaKind>(QA_FORMS.map((f) => f.kind));

export interface QaDraft {
  app: string;
  kind: QaKind;
  answers: Record<string, string>;
  period: number;
  team: string;
}

export interface QaReport {
  app: string;
  kind: QaKind;
  answers: Record<string, string>;
  period: number;
  teamName: string;
  teamKey: string;
}

/**
 * Words about the people instead of the app. Teacher approval is the real
 * backstop; this just asks a kid to rewrite before it gets that far.
 */
export const UNKIND = /\b(stupid|dumb|trash|garbage|sucks?|suck(ed|y)|hate|ugly|loser|idiot|lame|worst|cringe|boring)\b/i;
export const RUDE = /\b(sex|porn|nazi|kill|f+u+c+k+|sh[i1]t|bitch|ass(hole)?|dick|damn)\b/i;

export type QaCheck = { ok: true; report: QaReport } | { ok: false; error: string; field?: string };

const APP_SLUG = /^[a-z0-9-]{2,60}$/;
const clean = (s: unknown, max = 400) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

export function checkReport(raw: unknown): QaCheck {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const app = clean(o.app, 60);
  if (!APP_SLUG.test(app)) return { ok: false, error: "Pick the app you tested." };
  const kind = o.kind as QaKind;
  if (!KINDS.has(kind)) return { ok: false, error: "Pick what kind of report this is." };
  const period = typeof o.period === "number" ? o.period : Number(o.period);
  if (!Number.isInteger(period) || period < 1 || period > 7) return { ok: false, error: "Pick your period." };
  const team = checkTeamName(o.team);
  if (!team.ok) return { ok: false, error: team.error };

  const given = (o.answers && typeof o.answers === "object" ? o.answers : {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const q of formFor(kind).questions) {
    const v = clean(given[q.key], q.key === "screen" ? 60 : 400);
    if (q.required && v.length < 3) return { ok: false, error: `Fill in "${q.label}"`, field: q.key };
    if (RUDE.test(v)) return { ok: false, error: "Keep it school appropriate.", field: q.key };
    if (UNKIND.test(v)) {
      return { ok: false, error: "Say what happened in the app, not what you think of it or the team. Specific helps them fix it.", field: q.key };
    }
    if (v) answers[q.key] = v;
  }
  return { ok: true, report: { app, kind, answers, period, teamName: team.name, teamKey: team.key } };
}

/** The app slug a reviewer's own team owns, so they can see reports about it. Same folder rule as the export. */
export const ownApp = (period: number, team: string): string => `p${period}-${teamKey(team)}`;

/** An idea report, as a story Launch Pad can take (see LaunchPad's ?story=). */
export function ideaAsStory(answers: Record<string, string>) {
  return { asA: answers.asA ?? "", iWant: answers.iWant ?? "", soThat: answers.soThat ?? "", feature: "" };
}

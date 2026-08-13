/**
 * The join questionnaire (session 3c).
 *
 * What an applicant is asked, and what counts as a valid answer. This module is
 * pure and framework-free on purpose: it holds the question set and the
 * validation, so the form, the API route, and the approval queue in 3d all read
 * the same definitions, and the rules can be unit tested without a browser or a
 * database.
 *
 * Four questions plus a name. The brief asks for "enough information to make an
 * approval decision (employer, affiliation to industry/AI)", and nothing more,
 * because every extra field costs applicants and the site's first quality
 * measure is that members actually turn up and contribute. Career history,
 * photo, and the rest belong to the profile in session 4, after someone is in.
 *
 * The free-text question is required only when the industry answer is "other".
 * That is the one case where the structured answers do not decide anything, so
 * the field appears as required exactly when an administrator would otherwise
 * be reading three boxes and guessing.
 *
 * No em dashes anywhere, per the house rule.
 */

export const JOIN_INDUSTRIES = ["grid", "ai", "other"] as const;
export type JoinIndustry = (typeof JOIN_INDUSTRIES)[number];

export interface JoinChoice {
  value: JoinIndustry;
  label: string;
  help: string;
}

export interface JoinQuestion {
  /** Stable key. Single-line answers land in join_answers under this name. */
  key: string;
  label: string;
  /** Shown under the label. Says why the question is asked, not how to answer it. */
  help?: string;
  kind: "text" | "textarea" | "choice";
  required: boolean;
  maxLength: number;
  choices?: readonly JoinChoice[];
  autoComplete?: string;
}

/**
 * The applicant's name is a column rather than a join answer, because it is
 * `site_members.display_name`: the thing an administrator reads in the queue
 * and the thing every other member sees later. It is asked here because a magic
 * link proves an address and tells us nothing else.
 */
export const NAME_QUESTION: JoinQuestion = {
  key: "display_name",
  label: "Your name",
  help: "How you want to be listed to other members.",
  kind: "text",
  required: true,
  maxLength: 80,
  autoComplete: "name",
};

/** The four questions stored in site_members.join_answers. */
export const JOIN_QUESTIONS: readonly JoinQuestion[] = [
  {
    key: "employer",
    label: "Employer",
    help: "The organization you work for. This is the single most useful answer for an administrator.",
    kind: "text",
    required: true,
    maxLength: 120,
    autoComplete: "organization",
  },
  {
    key: "role_title",
    label: "Role or title",
    kind: "text",
    required: true,
    maxLength: 120,
    autoComplete: "organization-title",
  },
  {
    key: "industry",
    label: "Where does your work sit?",
    kind: "choice",
    required: true,
    maxLength: 16,
    choices: [
      {
        value: "grid",
        label: "The electric grid or power industry",
        help: "A utility, an operator, a regulator, or a supplier to them.",
      },
      {
        value: "ai",
        label: "The AI industry",
        help: "Models, tools, data centers, or hardware.",
      },
      { value: "other", label: "Neither, or both", help: "Tell us below." },
    ],
  },
  {
    key: "interest",
    label: "What are you hoping to get from the forum?",
    help: "A line or two is plenty.",
    kind: "textarea",
    // Required only when the industry answer is "other". See requiresInterest.
    required: false,
    maxLength: 600,
  },
];

/** Every question, in the order the form asks them. */
export const ALL_JOIN_QUESTIONS: readonly JoinQuestion[] = [
  NAME_QUESTION,
  ...JOIN_QUESTIONS,
];

/** The keys accepted into join_answers. Anything else in a payload is dropped. */
export const JOIN_ANSWER_KEYS: readonly string[] = JOIN_QUESTIONS.map((q) => q.key);

export interface JoinSubmission {
  /** Written to site_members.display_name. */
  displayName: string;
  /** Written to site_members.join_answers. Only non-empty answers appear. */
  answers: Record<string, string>;
}

export type JoinValidation =
  | { ok: true; submission: JoinSubmission }
  | { ok: false; errors: Record<string, string> };

/**
 * Whether the free-text question is required for this industry answer.
 *
 * Exported because the form needs to mark the field required as soon as the
 * radio changes, and it must be the same rule the server applies rather than a
 * second copy of it.
 */
export function requiresInterest(industry: string): boolean {
  return industry === "other";
}

/**
 * Collapse a single-line answer to something worth storing.
 *
 * Control characters go, including the newlines a paste can carry into a
 * single-line field, and runs of whitespace become one space. The result is
 * what gets compared against the required check, so a field of spaces is empty.
 */
function cleanLine(value: unknown): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Same, but paragraphs survive. Blank runs collapse to one blank line. */
function cleanBlock(value: unknown): string {
  if (typeof value !== "string") return "";
  return (
    value
      .replace(/\r\n?/g, "\n")
      // Newline survives this pass. Every other control character does not.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ")
      .replace(/[ \t]+/g, " ")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Validate a submitted questionnaire.
 *
 * Every error is returned at once, keyed by field, rather than one at a time.
 * An applicant should not discover a third problem after fixing the second.
 */
export function validateJoinSubmission(input: unknown): JoinValidation {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const displayName = cleanLine(body[NAME_QUESTION.key]);
  if (!displayName) {
    errors[NAME_QUESTION.key] = "Tell us what to call you.";
  } else if (displayName.length > NAME_QUESTION.maxLength) {
    errors[NAME_QUESTION.key] = `Please keep this under ${NAME_QUESTION.maxLength} characters.`;
  }

  const answers: Record<string, string> = {};
  const industry = cleanLine(body.industry);

  for (const question of JOIN_QUESTIONS) {
    const raw = body[question.key];
    const value = question.kind === "textarea" ? cleanBlock(raw) : cleanLine(raw);

    if (question.kind === "choice") {
      if (!value) {
        errors[question.key] = "Pick the one that fits best.";
      } else if (!(JOIN_INDUSTRIES as readonly string[]).includes(value)) {
        errors[question.key] = "Pick one of the options shown.";
      } else {
        answers[question.key] = value;
      }
      continue;
    }

    const required =
      question.required || (question.key === "interest" && requiresInterest(industry));

    if (!value) {
      if (required) {
        errors[question.key] =
          question.key === "interest"
            ? "Tell us a little about your interest, since your work sits outside both industries."
            : "This one is needed to make a decision.";
      }
      // An unanswered optional question is absent from join_answers rather than
      // stored as an empty string, so a later reader can tell "did not answer"
      // from "answered with nothing".
      continue;
    }

    if (value.length > question.maxLength) {
      errors[question.key] = `Please keep this under ${question.maxLength} characters.`;
      continue;
    }

    answers[question.key] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, submission: { displayName, answers } };
}

/**
 * Turn stored answers into label and value pairs for display.
 *
 * Used by the applicant's own pending screen and, in 3d, by the approval queue.
 * Answers whose key is no longer a question still show, under their raw key, so
 * changing the question set never silently hides what somebody actually told
 * us.
 */
export function summarizeJoinAnswers(
  answers: Record<string, unknown> | null | undefined,
): { key: string; label: string; value: string }[] {
  const source = answers && typeof answers === "object" ? answers : {};
  const seen = new Set<string>();
  const rows: { key: string; label: string; value: string }[] = [];

  for (const question of JOIN_QUESTIONS) {
    seen.add(question.key);
    const raw = source[question.key];
    if (typeof raw !== "string" || !raw) continue;

    const choice = question.choices?.find((c) => c.value === raw);
    rows.push({ key: question.key, label: question.label, value: choice?.label ?? raw });
  }

  for (const [key, raw] of Object.entries(source)) {
    if (seen.has(key) || typeof raw !== "string" || !raw) continue;
    rows.push({ key, label: key, value: raw });
  }

  return rows;
}

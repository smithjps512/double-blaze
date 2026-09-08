/**
 * Writing a user story, and what falls out of one.
 *
 * A story is not a wish. It is the thing the whole rest of the chain is built
 * from: the prototype, the test plan, the build card, the design brief. So this
 * module does three jobs, and all three are deterministic on purpose.
 *
 * **Checking** a draft is rules a student could apply on paper. "Your criterion
 * says the animation must be entertaining. What would you look at to know it
 * was?" is a better sentence coming from a checklist than from a model, because
 * a checklist is consistent and can be argued with.
 *
 * **Deriving the test plan** is the important one. A test plan written by a
 * model would be fluent whatever the story said, and a vague acceptance
 * criterion would quietly produce a plausible looking test. Derived by rule, a
 * vague criterion produces a visibly useless test, and the student can see that
 * the problem is upstream in their own writing. That is the entire lesson of
 * test planning and it only lands if the derivation is dumb enough to be
 * honest.
 *
 * **Code directions** are a first draft, and say so. Which patterns a feature
 * needs is judgment; what this can do is notice that a criterion says "save"
 * and point at the pattern about saving.
 *
 * Pure, like the rest of this package. No model, no network, no file system.
 */

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

export interface ScenarioDraft {
  given: string;
  when: string;
  then: string;
}

export interface StoryDraft {
  /** The heading this story gets in the team's file. */
  title: string;
  /** "As a ___" */
  role: string;
  /** "I want ___" */
  want: string;
  /** "so that ___" */
  soThat: string;
  criteria: string[];
  scenarios: ScenarioDraft[];
}

export function emptyDraft(): StoryDraft {
  return { title: "", role: "", want: "", soThat: "", criteria: [""], scenarios: [{ given: "", when: "", then: "" }] };
}

// ---------------------------------------------------------------------------
// Checking a draft
// ---------------------------------------------------------------------------

export type CheckLevel = "missing" | "weak" | "good";

export interface StoryCheck {
  /** Which part of the form this is about, so the page can point at it. */
  field: "title" | "role" | "want" | "soThat" | "criteria" | "scenarios";
  level: CheckLevel;
  /** What to say to the student. Short, and never sarcastic. */
  message: string;
}

/**
 * Words that describe how somebody feels rather than what the app does.
 *
 * A criterion built on one of these cannot be checked by looking at a screen,
 * which is not the same as it being a bad idea. House Points genuinely wrote
 * "the animation must be entertaining to as many people as possible", and that
 * is a real thing they care about. It is just not a test, and knowing the
 * difference is the skill.
 */
const FEELING_WORDS = [
  "entertaining", "fun", "cool", "nice", "good", "great", "better", "best",
  "easy", "simple", "enjoyable", "pretty", "beautiful", "interesting", "boring",
  "exciting", "friendly", "clean", "smooth", "fast enough", "user friendly",
  "intuitive", "engaging", "appealing", "satisfying",
];

/** Phrases that describe a thing existing rather than a thing happening. */
const EXISTENCE_OPENERS = [
  "we must have", "we need", "we must make sure", "we need to make sure",
  "there must be", "there should be", "make it so", "it should have",
  "we should have", "the app must have", "it must have",
];

/** A rule that refuses something. These earn a second test: break it on purpose. */
const LIMIT_WORDS = [
  "not able", "cannot", "can not", "can't", "must not", "never", "no more than",
  "at most", "maximum", "max ", "limit", "only", "unless", "refuse", "block",
  "prevent", "stop", "deny", "less than", "fewer than", "up to",
];

const has = (text: string, words: string[]): string | null => {
  const low = ` ${text.toLowerCase()} `;
  return words.find((w) => low.includes(w.toLowerCase())) ?? null;
};

/** Roughly, how many words. Used only to notice one-word answers. */
const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export function checkStory(draft: StoryDraft): StoryCheck[] {
  const out: StoryCheck[] = [];

  // --- Narrative ---
  if (!draft.title.trim()) {
    out.push({ field: "title", level: "missing", message: "Give it a short name. Two or three words, like \"Add points\"." });
  } else if (wordCount(draft.title) > 8) {
    out.push({ field: "title", level: "weak", message: "That is a sentence, not a name. Shorten it to two or three words." });
  } else {
    out.push({ field: "title", level: "good", message: "Good name." });
  }

  if (!draft.role.trim()) {
    out.push({ field: "role", level: "missing", message: "Who is this for? A kind of person, like \"a teacher\", not somebody's name." });
  } else if (/^(i|me|myself|you)$/i.test(draft.role.trim())) {
    out.push({
      field: "role",
      level: "weak",
      message: "\"I\" is not a kind of person. Who else is like you here? A student, a teacher, a rider?",
    });
  } else if (/^[A-Z][a-z]+$/.test(draft.role.trim()) && wordCount(draft.role) === 1) {
    out.push({
      field: "role",
      level: "weak",
      message: "That looks like somebody's name. A story names a kind of person, so it still makes sense when they leave.",
    });
  } else {
    out.push({ field: "role", level: "good", message: "A kind of person. That is right." });
  }

  if (!draft.want.trim()) {
    out.push({
      field: "want",
      level: "missing",
      message: "What do they want to do? Usually \"to\" and a verb: to see, to add, to choose.",
    });
  } else if (wordCount(draft.want) < 3) {
    out.push({ field: "want", level: "weak", message: "Say a bit more. What do they actually do, and to what?" });
  } else {
    out.push({ field: "want", level: "good", message: "Clear enough to build from." });
  }

  if (!draft.soThat.trim()) {
    out.push({
      field: "soThat",
      level: "missing",
      message: "This is the half everybody skips and it is the most valuable one. Why do they want it? What goes wrong without it?",
    });
  } else if (
    draft.soThat.trim().toLowerCase().replace(/[^a-z ]/g, "").startsWith("i can " + draft.want.trim().toLowerCase().replace(/[^a-z ]/g, "").slice(0, 12))
  ) {
    out.push({
      field: "soThat",
      level: "weak",
      message: "That repeats the want in different words. The reason is what happens because of it, not the thing itself.",
    });
  } else {
    out.push({ field: "soThat", level: "good", message: "A real reason. Keep it." });
  }

  // --- Acceptance criteria ---
  const criteria = draft.criteria.map((c) => c.trim()).filter(Boolean);
  if (criteria.length === 0) {
    out.push({
      field: "criteria",
      level: "missing",
      message: "Write at least two. These are your finish line: how anybody, including you, knows this is done.",
    });
  } else if (criteria.length === 1) {
    out.push({ field: "criteria", level: "weak", message: "One is a start. Two or three is usually where a feature actually lives." });
  } else {
    out.push({ field: "criteria", level: "good", message: `${criteria.length} criteria. That is a finish line somebody could check.` });
  }

  for (const c of criteria) {
    const feeling = has(c, FEELING_WORDS);
    if (feeling) {
      out.push({
        field: "criteria",
        level: "weak",
        message: `"${short(c)}" rests on the word "${feeling.trim()}". That is a real thing to want and it is not something you can look at a screen and check. What would you see if it were true?`,
      });
      continue;
    }
    const opener = has(c, EXISTENCE_OPENERS);
    if (opener) {
      out.push({
        field: "criteria",
        level: "weak",
        message: `"${short(c)}" says a thing has to exist. A criterion says what happens. Try: when somebody does X, Y happens.`,
      });
    }
  }

  // --- Scenarios ---
  const scenarios = draft.scenarios.filter((s) => s.given.trim() || s.when.trim() || s.then.trim());
  if (scenarios.length === 0) {
    out.push({
      field: "scenarios",
      level: "missing",
      message: "Write one scenario. Given something is true, When somebody does a thing, Then this happens.",
    });
  } else {
    for (const s of scenarios) {
      const blanks = [
        !s.given.trim() && "Given",
        !s.when.trim() && "When",
        !s.then.trim() && "Then",
      ].filter(Boolean);
      if (blanks.length > 0) {
        out.push({
          field: "scenarios",
          level: "weak",
          message: `One scenario is missing its ${blanks.join(" and ")}. All three are needed or it cannot become a test.`,
        });
      }
    }
    if (scenarios.every((s) => s.given.trim() && s.when.trim() && s.then.trim())) {
      out.push({
        field: "scenarios",
        level: "good",
        message: `${scenarios.length} complete ${scenarios.length === 1 ? "scenario" : "scenarios"}. ${scenarios.length === 1 ? "It becomes a test on its own." : "They become tests on their own."}`,
      });
    }
  }

  return out;
}

/** Enough of a criterion to know which one is meant, without a wall of text. */
function short(text: string, max = 46): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : max)}...`;
}

/** True once nothing is missing. Weak notes are advice, not a gate. */
export function isComplete(checks: StoryCheck[]): boolean {
  return !checks.some((c) => c.level === "missing");
}

// ---------------------------------------------------------------------------
// The story, as markdown
// ---------------------------------------------------------------------------

/**
 * The block that goes into the team's `user-stories.md`.
 *
 * Deliberately the same shape as every story already in those files, indented
 * criteria and all, so an approved new story is indistinguishable from the ones
 * the teams wrote by hand and the parser needs no special case.
 */
export function renderStory(draft: StoryDraft): string {
  // Their words go in verbatim, apart from a leading capital and a trailing
  // full stop. Quietly inserting a missing "to" would be this module editing a
  // student's sentence, which is the one thing nothing here is allowed to do.
  // The form asks for the phrasing that reads correctly instead.
  const lines: string[] = [];
  const role = draft.role.trim().replace(/^(an?|the)\s+/i, "");
  lines.push(`As a ${role}, I want ${lower(draft.want)}, so that ${lower(draft.soThat)}.`.replace(/\.+$/, "."));
  lines.push("");
  for (const c of draft.criteria.map((c) => c.trim()).filter(Boolean)) {
    lines.push(`  - ${c.replace(/\.$/, "")}`);
  }
  for (const s of draft.scenarios) {
    if (!s.given.trim() && !s.when.trim() && !s.then.trim()) continue;
    lines.push("");
    if (s.given.trim()) lines.push(`  Given ${lower(s.given)}`);
    if (s.when.trim()) lines.push(`  When ${lower(s.when)}`);
    if (s.then.trim()) lines.push(`  Then ${lower(s.then)}`);
  }
  return lines.join("\n");
}

/** Students type "I want to See the bus" as often as not. */
function lower(text: string): string {
  const t = text.trim().replace(/\.$/, "");
  if (!t) return "";
  // Only the first letter, and only when the rest is not itself capitalised,
  // so a name like "BMS Crew" survives.
  return /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

// ---------------------------------------------------------------------------
// The test plan
// ---------------------------------------------------------------------------

export interface TestCase {
  id: string;
  /** Where this test came from, which is the whole point of showing it. */
  from: "scenario" | "criterion" | "break";
  source: string;
  /** What has to be true for this test to pass. */
  passesWhen: string;
  /**
   * What somebody actually does, or null when the story does not say.
   *
   * This blank is the most useful thing on the page. A Given/When/Then scenario
   * hands you the steps and the result; an acceptance criterion only hands you
   * the result, and the student has to work out how they would find out. Seeing
   * half the table filled in and half of it empty is the argument for writing
   * scenarios, made without anybody having to give a speech about it.
   */
  steps: string[] | null;
}

export interface UntestableNote {
  criterion: string;
  why: string;
}

export interface TestPlan {
  storyTitle: string;
  cases: TestCase[];
  /** Criteria that could not be turned into a test, and why. */
  untestable: UntestableNote[];
}

/**
 * Turn a story into a test plan.
 *
 * Three rules, and a student can apply all three on paper:
 *
 * 1. Every complete scenario is already a test. Given is the setup, When is the
 *    step, Then is what you expect. Nothing to invent.
 * 2. Every acceptance criterion becomes a test that checks it.
 * 3. Every criterion that refuses something gets a second test that tries to do
 *    the refused thing, because the only way to know a rule works is to break
 *    it on purpose. Their own architecture pages already say this.
 *
 * And one refusal: a criterion nobody could check by looking at the app does
 * not get a test, it gets a note saying so. Inventing a test for "the animation
 * must be entertaining" would teach the opposite of the lesson.
 */
export function testPlanFor(story: {
  title: string;
  criteria: string[];
  scenarios: Array<{ given?: string; when?: string; then?: string; raw?: string }>;
}): TestPlan {
  const cases: TestCase[] = [];
  const untestable: UntestableNote[] = [];
  let n = 0;
  const next = () => `T${(n += 1)}`;

  for (const s of story.scenarios) {
    const given = (s.given ?? "").trim();
    const when = (s.when ?? "").trim();
    const then = (s.then ?? "").trim();
    if (!when && !then) continue;
    const steps: string[] = [];
    if (given) steps.push(`Set it up so that ${lower(given)}.`);
    steps.push(when ? `${sentence(when)}.` : "Use the feature.");
    cases.push({
      id: next(),
      from: "scenario",
      source: [given && `Given ${given}`, when && `When ${when}`, then && `Then ${then}`].filter(Boolean).join(", "),
      passesWhen: then ? sentence(then) : "The story does not say. Decide what should happen and write it into the Then.",
      steps,
    });
  }

  for (const raw of story.criteria) {
    const criterion = raw.trim();
    if (!criterion) continue;

    const feeling = has(criterion, FEELING_WORDS);
    if (feeling) {
      untestable.push({
        criterion,
        why: `the wording rests on "${feeling.trim()}", which is how somebody feels rather than something you can look at and check`,
      });
      continue;
    }

    const opener = has(criterion, EXISTENCE_OPENERS);
    if (opener) {
      untestable.push({
        criterion,
        why: "the wording describes a thing existing rather than something happening",
      });
      continue;
    }

    // No steps on purpose. A criterion says what has to be true, not what you
    // do to find out, and pretending otherwise would hide the difference
    // between a criterion and a scenario.
    cases.push({
      id: next(),
      from: "criterion",
      source: criterion,
      passesWhen: sentence(criterion),
      steps: null,
    });

    const limit = has(criterion, LIMIT_WORDS);
    if (limit) {
      cases.push({
        id: next(),
        from: "break",
        source: criterion,
        passesWhen: "The app refuses, and says why in words somebody can understand.",
        steps: [
          "Do the thing this rule is supposed to refuse.",
          "Go past the limit on purpose, not by accident.",
        ],
      });
    }
  }

  return { storyTitle: story.title, cases, untestable };
}

/**
 * A test plan for a story the parser read out of a team's file.
 *
 * The parser keeps acceptance criteria and Given/When/Then scenarios in one
 * list, because a student's file mixes them and telling them apart afterwards
 * is easy: a scenario has a When or a Then, and everything else is a criterion.
 * Doing that split here rather than in the parser keeps the parser's job as
 * "what did they write" and puts the interpretation where it is used.
 */
export function planFromStory(story: {
  featureHint?: string;
  want: string;
  scenarios: Array<{ given?: string; when?: string; then?: string; raw: string }>;
}): TestPlan {
  const criteria = story.scenarios.filter((s) => !s.when && !s.then).map((s) => s.raw);
  const scenarios = story.scenarios.filter((s) => s.when || s.then);
  return testPlanFor({ title: story.featureHint || story.want, criteria, scenarios });
}

/** The same split, for the pattern hints. */
export function patternsFromStory(story: {
  scenarios: Array<{ given?: string; when?: string; then?: string; raw: string }>;
}): PatternHint[] {
  return suggestPatterns({
    criteria: story.scenarios.filter((s) => !s.when && !s.then).map((s) => s.raw),
    scenarios: story.scenarios.filter((s) => s.when || s.then),
  });
}

function sentence(text: string): string {
  const t = text.trim().replace(/\.$/, "");
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

const FROM_LABEL: Record<TestCase["from"], string> = {
  scenario: "Your scenario",
  criterion: "A criterion",
  break: "Breaking a rule",
};

export function renderTestPlan(plan: TestPlan): string {
  const out: string[] = [];
  out.push(`### ${plan.storyTitle}`);
  out.push("");

  if (plan.cases.length === 0) {
    out.push(
      "Nothing here can be tested yet, which means this story does not say what done looks like. That is a finding about the story, not about the testing.",
    );
    out.push("");
  } else {
    out.push("| # | What somebody does | It passes when | Came from |");
    out.push("|---|---|---|---|");
    for (const c of plan.cases) {
      const steps = c.steps ? c.steps.join(" ") : "**You write this.** What would you actually do to find out?";
      out.push(`| ${c.id} | ${steps} | ${c.passesWhen} | ${FROM_LABEL[c.from]} |`);
    }
    out.push("");

    const filled = plan.cases.filter((c) => c.steps !== null).length;
    const blanks = plan.cases.filter((c) => c.steps === null).length;
    if (blanks > 0 && filled > 0) {
      out.push(
        `Look at the gaps. ${blanks === 1 ? "One row has" : `${blanks} rows have`} nothing in the middle column, and every one of them came from an acceptance criterion. A criterion tells you what has to be **true**. It never tells you what somebody **does**. Your Given/When/Then scenarios filled in both columns by themselves, and that is what the extra typing buys you.`,
      );
      out.push("");
    } else if (blanks > 0) {
      out.push(
        "Every row is missing its middle column, because this story has criteria and no scenarios. Write one Given/When/Then and the next version of this table fills half of itself in.",
      );
      out.push("");
    }
  }

  if (plan.untestable.length > 0) {
    // Grouped by reason, because the same sentence three times reads as a
    // machine repeating itself rather than as a point being made.
    const grouped = new Map<string, string[]>();
    for (const u of plan.untestable) {
      grouped.set(u.why, [...(grouped.get(u.why) ?? []), u.criterion]);
    }
    out.push(
      `**${plan.untestable.length === 1 ? "One criterion has" : `${plan.untestable.length} criteria have`} no test at all**, and that is the most useful thing on this page.`,
    );
    out.push("");
    for (const [why, criteria] of grouped) {
      for (const c of criteria) out.push(`- *"${c}"*`);
      out.push("");
      out.push(
        `  ${criteria.length === 1 ? "No test, because" : "No tests, because"} ${why}. Rewrite ${criteria.length === 1 ? "it" : "them"} as **when somebody does this, that happens**, and ${criteria.length === 1 ? "it becomes" : "they become"} something you can actually check.`,
      );
      out.push("");
    }
  }

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Code directions
// ---------------------------------------------------------------------------

/**
 * Which Pattern Book patterns a story probably needs.
 *
 * A first draft and labelled as one. Pattern order is judgment, which is why
 * the architecture pages were written by hand; what a rule can do is notice
 * that a criterion says "save" and point at the pattern about saving. A team
 * that disagrees with this list and can say why has learned more than a team
 * handed the right answer.
 */
const PATTERN_HINTS: Array<{ pattern: number; name: string; words: string[] }> = [
  { pattern: 1, name: "Make a button do something", words: ["click", "tap", "press", "button", "submit", "hit "] },
  { pattern: 2, name: "Read what somebody typed", words: ["type", "typed", "enter", "input", "fill in", "write in", "amount"] },
  { pattern: 3, name: "Put something on the screen", words: ["show", "shows", "display", "see", "appears", "says"] },
  { pattern: 4, name: "Go to another screen", words: ["go to", "goes to", "open", "opens", "back", "return", "navigate", "screen"] },
  { pattern: 5, name: "Tell the user something happened", words: ["tell", "message", "confirm", "notify", "let them know", "says it worked"] },
  { pattern: 6, name: "Check before you act", words: LIMIT_WORDS },
  { pattern: 7, name: "Save something to the database", words: ["save", "saved", "add", "adds", "store", "stored", "post", "create", "record", "log"] },
  { pattern: 8, name: "Get things back out of the database", words: ["load", "get", "list of", "all the", "every ", "history", "previous"] },
  { pattern: 9, name: "Show a list on the screen", words: ["list", "each", "every ", "feed", "scroll"] },
  { pattern: 10, name: "Change something already saved", words: ["edit", "change", "update", "remove", "delete", "take off", "cancel"] },
  { pattern: 11, name: "Put a list in order", words: ["order", "sorted", "newest", "oldest", "highest", "lowest", "rank", "top ", "first"] },
  { pattern: 12, name: "Only let some people in", words: ["sign in", "log in", "login", "account", "password", "only teachers", "only staff", "logged in"] },
  { pattern: 13, name: "Let somebody choose from a list", words: ["choose", "chooses", "pick", "picks", "select", "dropdown", "drop down", "option"] },
  { pattern: 14, name: "Show and hide things", words: ["hide", "hidden", "invisible", "appear", "disappear", "only shows", "shown when"] },
];

export interface PatternHint {
  pattern: number;
  name: string;
  because: string;
}

export function suggestPatterns(story: { criteria: string[]; scenarios: Array<{ given?: string; when?: string; then?: string }> }): PatternHint[] {
  const text = [
    ...story.criteria,
    ...story.scenarios.flatMap((s) => [s.given ?? "", s.when ?? "", s.then ?? ""]),
  ]
    .join(" \n ")
    .toLowerCase();

  const hits: PatternHint[] = [];
  for (const hint of PATTERN_HINTS) {
    const word = hint.words.find((w) => text.includes(w.toLowerCase()));
    if (word) hits.push({ pattern: hint.pattern, name: hint.name, because: word.trim() });
  }
  return hits.sort((a, b) => a.pattern - b.pattern);
}

/**
 * The build card a new story earns, as markdown.
 *
 * Same shape as the cards written by hand, because a team should not be able to
 * tell which of their cards came from which route.
 */
export function renderCodeDirections(draft: StoryDraft): string {
  const plan = testPlanFor({
    title: draft.title,
    criteria: draft.criteria,
    scenarios: draft.scenarios,
  });
  const patterns = suggestPatterns({ criteria: draft.criteria, scenarios: draft.scenarios });
  const criteria = draft.criteria.map((c) => c.trim()).filter(Boolean);

  const out: string[] = [];
  out.push(`## ${draft.title || "Untitled"}`);
  out.push("");
  out.push(`**Your story.** ${renderStory(draft).split("\n")[0]}`);
  out.push("");
  out.push("**Done when:**");
  for (const c of criteria) out.push(`- [ ] ${c.replace(/\.$/, "")}`);
  out.push("");

  if (plan.cases.length > 0) {
    out.push(`**Test it by:** ${plan.cases.length} ${plan.cases.length === 1 ? "check" : "checks"} on your test plan page.`);
    const breaks = plan.cases.filter((c) => c.from === "break");
    if (breaks.length > 0) {
      out.push("");
      out.push(
        `**Break it on purpose.** ${breaks.length === 1 ? "One of your criteria refuses something" : `${breaks.length} of your criteria refuse something`}, and a rule you have not failed on purpose is a rule you do not know works.`,
      );
    }
    out.push("");
  }

  if (patterns.length > 0) {
    out.push("**Patterns this probably needs.** A first guess from the words in your own criteria, not a verdict. Read them, decide the order yourselves, and put the order on your architecture page.");
    out.push("");
    for (const p of patterns) {
      out.push(`- **Pattern ${p.pattern}: ${p.name}** — because you wrote "${p.because}"`);
    }
    out.push("");
  } else {
    out.push(
      "**No patterns matched your criteria**, which usually means they describe how something feels rather than what the app does. Go back to the test plan page and look at what it could not test.",
    );
    out.push("");
  }

  out.push("**Before you write any code**, add this feature's screens and component names to your architecture page. Every blank in the Pattern Book is a name from that page, so a feature that is not on it cannot be built from the book.");
  out.push("");
  return out.join("\n");
}

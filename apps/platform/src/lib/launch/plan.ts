/**
 * Launch Pad: a sixth grade team's first plan for anything.
 *
 * Three ideas and nothing else: the purpose is the change it makes, there is
 * always more than one user, and a user story says who, what and why. This
 * file is the shape of what a team writes, the coaching they see while they
 * write it, and the markdown it becomes for the prototype generator.
 *
 * Pure, so the page, the API and the export script all agree, and so the
 * coaching can be tested. The coaching is rules, not a model: every hint is
 * something a student could have checked on paper. No em dashes in any copy.
 */

export interface LaunchUser {
  /** A kind of person, never a student's name: "Students", "Cafeteria staff". */
  name: string;
  /** One sentence: what matters to them. */
  cares: string;
}

/**
 * One exact situation for a story, in Given/When/Then. A happy path is the
 * story going right; a bad day is something going wrong that the app still
 * has to handle. Bad days are the bugs nobody wrote down yet.
 */
export interface LaunchScenario {
  kind: "happy" | "bad";
  given: string;
  when: string;
  then: string;
}

export interface LaunchStory {
  /** A short name for the feature this story asks for: "Photo search". */
  feature: string;
  asA: string;
  iWant: string;
  soThat: string;
  /** Acceptance criteria: how we would know it works. Two make a story done. */
  criteria: string[];
  scenarios: LaunchScenario[];
}

export interface LaunchPlan {
  productName: string;
  /** What it is, in one sentence. The elevator pitch. */
  idea: string;
  /** School, Blacksburg, a club, a team: the community it is for. */
  community: string;
  purpose: string;
  users: LaunchUser[];
  stories: LaunchStory[];
}

export const LIMITS = {
  short: 80,
  sentence: 400,
  users: 8,
  stories: 10,
  criteria: 5,
  scenarios: 4,
} as const;

/** The Definition of Done asks for this many checks on every story. */
export const CHECKS_GOAL = 2;

export const STORY_GOAL = 3;
export const USER_GOAL = 2;

export function emptyStory(): LaunchStory {
  return { feature: "", asA: "", iWant: "", soThat: "", criteria: [], scenarios: [] };
}

export function emptyPlan(): LaunchPlan {
  return {
    productName: "",
    idea: "",
    community: "",
    purpose: "",
    users: [
      { name: "", cares: "" },
      { name: "", cares: "" },
    ],
    stories: [emptyStory(), emptyStory(), emptyStory()],
  };
}

/* ------------------------------------------------------------- cleaning */

function str(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // Control characters out, newlines collapsed: every field is one line.
  return raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").slice(0, max);
}

/**
 * Whatever arrives over the wire, as a plan. Never throws: a field that is the
 * wrong shape comes back empty, because a sixth grader's half typed plan is
 * still worth saving.
 */
export function cleanPlan(raw: unknown): LaunchPlan {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const users = Array.isArray(o.users) ? o.users.slice(0, LIMITS.users) : [];
  const stories = Array.isArray(o.stories) ? o.stories.slice(0, LIMITS.stories) : [];
  return {
    productName: str(o.productName, LIMITS.short),
    idea: str(o.idea, LIMITS.sentence),
    community: str(o.community, LIMITS.short),
    purpose: str(o.purpose, LIMITS.sentence * 2),
    users: users.map((u) => {
      const r = (u && typeof u === "object" ? u : {}) as Record<string, unknown>;
      return { name: str(r.name, LIMITS.short), cares: str(r.cares, LIMITS.sentence) };
    }),
    stories: stories.map((s) => {
      const r = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      const criteria = Array.isArray(r.criteria) ? r.criteria.slice(0, LIMITS.criteria) : [];
      const scenarios = Array.isArray(r.scenarios) ? r.scenarios.slice(0, LIMITS.scenarios) : [];
      return {
        feature: str(r.feature, LIMITS.short),
        asA: str(r.asA, LIMITS.short),
        iWant: str(r.iWant, LIMITS.sentence),
        soThat: str(r.soThat, LIMITS.sentence),
        criteria: criteria.map((c) => str(c, LIMITS.sentence)),
        scenarios: scenarios.map((x) => {
          const sc = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return {
            kind: sc.kind === "bad" ? ("bad" as const) : ("happy" as const),
            given: str(sc.given, LIMITS.sentence),
            when: str(sc.when, LIMITS.sentence),
            then: str(sc.then, LIMITS.sentence),
          };
        }),
      };
    }),
  };
}

/* ----------------------------------------------------------- team names */

export type TeamNameCheck = { ok: true; name: string; key: string } | { ok: false; error: string };

/** Short and blunt on purpose: the job is to stop the obvious, not to be a filter. */
const BLOCKED = /\b(sex|porn|nazi|kill|f+u+c+k+|sh[i1]t|bitch|ass(hole)?|dick|damn|hell)\b/i;

/**
 * A team name becomes the key two Chromebooks use to find the same plan, so
 * "The Lions", "the lions" and "THE LIONS!" are one team.
 */
export function checkTeamName(raw: unknown): TeamNameCheck {
  if (typeof raw !== "string") return { ok: false, error: "Type your team name." };
  const name = raw.replace(/\s+/g, " ").trim().slice(0, 40);
  const key = teamKey(name);
  if (key.length < 2) return { ok: false, error: "Type your team name. Use at least two letters." };
  if (BLOCKED.test(name)) return { ok: false, error: "Pick a team name you would say in front of the principal." };
  return { ok: true, name, key };
}

export function teamKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ------------------------------------------------------------- coaching */

export type HintLevel = "good" | "nudge" | "todo";

export interface Hint {
  level: HintLevel;
  text: string;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * Sentences that describe what a thing does rather than what changes. The
 * whole lesson of step 1 is the gap between these two, so this is the one
 * check that matters most and the one most worth keeping simple.
 */
const DOES = /^(it|this|our|the)\b[^.]{0,30}\b(is|are|lets|let|will|would|helps?|allows?|shows?|has|gives?|tells?|can)\b/i;
const CHANGE =
  /\b(so|because|instead|fewer|less|more|better|safer|faster|easier|healthier|happier|without|no longer|stop|stops|never|anymore|feel|feels|change|changes|save|saves|waste|lonely|left out|included|together)\b/i;

export function purposeHints(purpose: string): Hint[] {
  const p = purpose.trim();
  if (!p) return [{ level: "todo", text: "Write who is better off because your product exists, and how." }];
  const hints: Hint[] = [];
  if (words(p) < 8) {
    hints.push({ level: "nudge", text: "Say a little more. Who has the problem, and what is different for them after?" });
  }
  const sounds = DOES.test(p) || /\b(app|website|program|product) (that|which|where)\b/i.test(p);
  const changes = CHANGE.test(p);
  if (sounds && !changes) {
    hints.push({
      level: "nudge",
      text: "This tells what it does. Now tell the impact: what changes for people, or for our community, because it exists?",
    });
  } else if (changes && words(p) >= 8) {
    hints.push({ level: "good", text: "That sounds like an impact. Read it out loud: would someone outside your team care?" });
  }
  return hints;
}

/** The questions that turn up the users a team forgot. Shown as prompts, not rules. */
export const WHO_ELSE = [
  "Who uses it every day?",
  "Who runs it, fixes it, or keeps it up to date?",
  "Who pays for it or has to say yes to it?",
  "Who is affected by it, even if they never open it?",
] as const;

export function userHints(users: LaunchUser[]): Hint[] {
  const named = users.filter((u) => u.name.trim());
  const hints: Hint[] = [];
  if (named.length === 0) return [{ level: "todo", text: "Who will use this? Start with the obvious one." }];
  if (named.length < USER_GOAL) {
    hints.push({ level: "todo", text: "There is always more than one user. Who else? Try the questions below." });
  }
  const blank = named.filter((u) => !u.cares.trim());
  if (blank.length > 0) {
    hints.push({
      level: "todo",
      text: `Write one sentence about what matters to ${blank.map((u) => u.name.trim()).join(" and ")}.`,
    });
  }
  const adult = /\b(parent|teacher|staff|principal|coach|adult|driver|worker|owner|manager|admin|custodian|librarian|counselor|nurse|town|council|police|volunteer|business)/i;
  if (named.length >= USER_GOAL && !named.some((u) => adult.test(u.name))) {
    hints.push({ level: "nudge", text: "Is there an adult who runs it, pays for it, or says yes to it? They are users too." });
  }
  if (named.length >= 3 && blank.length === 0) {
    hints.push({ level: "good", text: `${named.length} users. Do any of them want different things? That is normal, and worth noticing.` });
  }
  return hints;
}

/** "Students", "a student" and "the Student" are the same user. */
function sameUser(a: string, b: string): boolean {
  const one = (s: string) => norm(s).replace(/^(a|an|the) /, "").replace(/(es|s)\b/g, "");
  return !!one(a) && one(a) === one(b);
}

export function storyHints(story: LaunchStory, users: LaunchUser[]): Hint[] {
  const { asA, iWant, soThat } = story;
  if (!asA.trim() && !iWant.trim() && !soThat.trim()) return [];
  const hints: Hint[] = [];
  if (!asA.trim()) hints.push({ level: "todo", text: "Who wants this? Pick one of your users." });
  else if (!users.some((u) => sameUser(u.name, asA))) {
    hints.push({ level: "nudge", text: `Is "${asA.trim()}" one of your users? If so, add them in step 2.` });
  }
  if (!iWant.trim()) hints.push({ level: "todo", text: "What do they want to do? That part becomes the feature." });
  if (!soThat.trim()) {
    hints.push({ level: "todo", text: "Finish the \"so I can\". It is the most important part: it is why this is worth building." });
  } else if (norm(soThat) === norm(iWant) || (words(soThat) < 3 && iWant.trim())) {
    hints.push({ level: "nudge", text: "The \"so I can\" should say why it matters to them, not repeat what they want." });
  }
  if ((iWant.match(/\band\b/gi) ?? []).length >= 2) {
    hints.push({ level: "nudge", text: "Lots of \"and\" in there. Could this be two stories?" });
  }
  if (hints.length === 0) hints.push({ level: "good", text: "Who, what and why. That is a user story." });
  return hints;
}

export function storyIsWritten(s: LaunchStory): boolean {
  return !!(s.asA.trim() && s.iWant.trim() && s.soThat.trim());
}

export function scenarioIsWritten(sc: LaunchScenario): boolean {
  return !!(sc.given.trim() && sc.when.trim() && sc.then.trim());
}

export interface DoneCheck {
  key: "story" | "checks" | "happy" | "bad";
  label: string;
  ok: boolean;
}

/**
 * The class's Definition of Done for one story: the same four lines on every
 * story card, so "is it done?" has an answer that is not an opinion.
 */
export function storyDone(s: LaunchStory): DoneCheck[] {
  const checks = s.criteria.filter((c) => c.trim()).length;
  return [
    { key: "story", label: "Who, what and why", ok: storyIsWritten(s) },
    { key: "checks", label: `At least ${CHECKS_GOAL} checks (${checks})`, ok: checks >= CHECKS_GOAL },
    { key: "happy", label: "A happy path scenario", ok: (s.scenarios ?? []).some((x) => x.kind === "happy" && scenarioIsWritten(x)) },
    { key: "bad", label: "A bad day scenario", ok: (s.scenarios ?? []).some((x) => x.kind === "bad" && scenarioIsWritten(x)) },
  ];
}

export const storyIsDone = (s: LaunchStory) => storyDone(s).every((c) => c.ok);

/** A QA bug report as a bad day: the steps are the When, the expectation is the Then. */
export function bugAsScenario(answers: Record<string, string>): LaunchScenario {
  const screen = (answers.screen ?? "").trim();
  return {
    kind: "bad",
    given: screen ? `I am on the ${screen.replace(/^(the|on the)\s+/i, "").replace(/\s+(screen|tab)$/i, "")} screen` : "",
    when: (answers.did ?? "").trim(),
    then: (answers.expected ?? "").trim(),
  };
}

/** How far a team is, for the progress strip and the teacher's list. */
export function progress(plan: LaunchPlan) {
  const users = plan.users.filter((u) => u.name.trim() && u.cares.trim()).length;
  const stories = plan.stories.filter(storyIsWritten).length;
  return {
    purpose: plan.purpose.trim().length > 0,
    users,
    stories,
    criteria: plan.stories.filter((s) => storyIsWritten(s) && s.criteria.some((c) => c.trim())).length,
    /** Stories that meet the whole Definition of Done. */
    doneStories: plan.stories.filter((s) => storyIsWritten(s) && storyIsDone(s)).length,
    done: plan.purpose.trim().length > 0 && users >= USER_GOAL && stories >= STORY_GOAL,
  };
}

/* ------------------------------------------------------------- level up */

/** Where a level up item sends the team, and what it does when they get there. */
export type LevelUpTarget =
  | { step: "purpose" }
  | { step: "users" }
  | { step: "stories"; story: number; bonus?: boolean; scenario?: "happy" | "bad" }
  | { step: "stories"; add: { asA: string } };

export interface LevelUpItem {
  /** Stable, so the page can key the list and a team can see an item go away. */
  id: string;
  text: string;
  action: string;
  target: LevelUpTarget;
}

/**
 * What would make a team's app better, as a to-do list, most important first.
 *
 * The same gaps the prototype's coach notes name, said the way a sixth grader
 * can act on, each pointing at the exact box to fix. Every item disappears
 * when the box is filled, so the list getting shorter is the progress bar.
 * The last item is always "add another story": an app is never finished.
 */
export function levelUp(plan: LaunchPlan): LevelUpItem[] {
  const items: LevelUpItem[] = [];
  if (purposeHints(plan.purpose).some((h) => h.level !== "good")) {
    items.push({
      id: "purpose",
      text: "Your purpose could say more about the impact: who is better off, and how?",
      action: "Fix the purpose",
      target: { step: "purpose" },
    });
  }
  const users = plan.users.filter((u) => clean(u.name));
  if (users.length < USER_GOAL || users.some((u) => !clean(u.cares))) {
    items.push({ id: "users", text: "Every app has more than one user, each with a sentence about what matters to them.", action: "Fix the users", target: { step: "users" } });
  }

  const written = plan.stories.map((s, i) => ({ s, i })).filter(({ s }) => clean(s.asA) || clean(s.iWant) || clean(s.soThat));
  for (const { s, i } of written) {
    const n = i + 1;
    if (!storyIsWritten(s)) {
      items.push({ id: `story-${n}-finish`, text: `Story ${n} is not finished. It needs a who, a what, and a "so I can".`, action: `Finish story ${n}`, target: { step: "stories", story: i } });
      continue;
    }
    if (!users.some((u) => sameUser(u.name, s.asA))) {
      items.push({
        id: `story-${n}-user`,
        text: `Story ${n} is for "${clean(s.asA)}", who is not on your list of users. Add them, so your app knows who they are.`,
        action: "Add them to your users",
        target: { step: "users" },
      });
    }
    const name = `Story ${n}${clean(s.feature) ? ` (${clean(s.feature)})` : ""}`;
    const checks = s.criteria.filter((c) => clean(c)).length;
    if (checks < CHECKS_GOAL) {
      items.push({
        id: `story-${n}-criteria`,
        text: checks === 0
          ? `${name} has nothing to click yet. Add how you would know it works, and its screen gets something to try.`
          : `${name} has 1 check. Done means at least ${CHECKS_GOAL}: what else would prove it works?`,
        action: `Add checks to story ${n}`,
        target: { step: "stories", story: i, bonus: true },
      });
    }
    const has = (kind: "happy" | "bad") => (s.scenarios ?? []).some((x) => x.kind === kind && scenarioIsWritten(x));
    if (!has("happy")) {
      items.push({
        id: `story-${n}-happy`,
        text: `${name} needs a happy path: Given what is true, When the user does what, Then what does the app do?`,
        action: "Write the happy path",
        target: { step: "stories", story: i, scenario: "happy" },
      });
    }
    if (!has("bad")) {
      items.push({
        id: `story-${n}-bad`,
        text: `${name} needs a bad day: what could go wrong, and what should the app do then?`,
        action: "Write a bad day",
        target: { step: "stories", story: i, scenario: "bad" },
      });
    }
  }

  for (const u of users) {
    if (!written.some(({ s }) => sameUser(u.name, s.asA))) {
      items.push({
        id: `user-${teamKey(u.name)}`,
        text: `Nobody has written a story for ${clean(u.name)} yet. What would they want to do with your app?`,
        action: `Write a story for ${clean(u.name)}`,
        target: { step: "stories", add: { asA: clean(u.name) } },
      });
    }
  }

  items.push({
    id: "another",
    text: "What else would one of your users want to do? Every new story becomes a new screen.",
    action: "Add another story",
    target: { step: "stories", add: { asA: "" } },
  });
  return items;
}

/* --------------------------------------------------------------- export */

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
/** Sixth graders type in lowercase. A screen title or a sentence should not start that way. */
const upperFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const sentence = (s: string) => {
  const t = upperFirst(clean(s).replace(/[.!]+$/, ""));
  return t ? `${t}.` : "";
};
/** "As a" text the way the sentence needs it: "students", not "Students". */
const role = (s: string) => singular(clean(s).replace(/^(a|an|the)\s+/i, ""));
/** Users are listed as groups ("Kids"), stories are about one of them ("As a kid"). */
function singular(s: string): string {
  // Only a plain group name: in "person that loves animals" the last word is not the user.
  if (/\b(who|that|which|with|at|of|for|from|in|on)\b/i.test(s)) return s;
  return s.replace(/(\w+)$/, (w) => {
    if (/(ss|us|is)$/i.test(w) || w.length < 4) return w;
    if (/ies$/i.test(w)) return w.slice(0, -3) + "y";
    if (/(ch|sh|x)es$/i.test(w)) return w.slice(0, -2);
    return w.replace(/s$/i, "");
  });
}
const article = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
/** Students often type "I want to..." into the "I want" box. Do not say it twice. */
const stripLead = (s: string, lead: RegExp) => clean(s).replace(lead, "").replace(/[.!]+$/, "");

function featureName(s: LaunchStory, i: number): string {
  if (clean(s.feature)) return upperFirst(clean(s.feature));
  const want = stripLead(s.iWant, /^(i\s+)?(want|would like|need)\s+(to\s+)?/i);
  const short = want.split(/\s+/).slice(0, 4).join(" ");
  return short ? short[0].toUpperCase() + short.slice(1) : `Feature ${i + 1}`;
}

/** The story as one sentence, in the form the class is taught. */
export function storySentence(s: LaunchStory): string {
  const who = role(s.asA) || "user";
  const want = stripLead(s.iWant, /^(i\s+)?(want|would like|need)\s+(to\s+)?/i);
  // The class fills in "so I can ___", but the generator reads "so that". A
  // blank filled with its own subject ("my jacket does not get donated") keeps it.
  const why = stripLead(s.soThat, /^so\s+(that\s+)?/i);
  const ownSubject = /^(i|we|they|my|our|their|it|its|the|people|everyone|nobody|no one|there|he|she|you|kids|students|parents)\b/i;
  const whyPart = !why ? "" : ownSubject.test(why) && !/^i\s+can\b/i.test(why)
    ? `, so that ${why}`
    : `, so that I can ${lowerFirst(why.replace(/^i\s+can\s+/i, ""))}`;
  return `As ${article(who)} ${lowerFirst(who)}, I want to ${lowerFirst(want)}${whyPart}.`.replace(/to to /g, "to ");
}

/**
 * The plan as `product-plan.md`, in exactly the headings the prototype
 * generator reads (see docs/students/README.md). A feature line per story,
 * because for a sixth grade team the story is the feature.
 */
export function toProductPlan(plan: LaunchPlan, teamName: string, period?: number): string {
  const name = upperFirst(clean(plan.productName)) || `${teamName}'s idea`;
  // A paragraph of its own: lines next to each other are one paragraph to the
  // parser, and "Team: The Lions Period: 3" is not the team's name.
  const lines = [`# ${name}`, "", `Team: ${teamName}`, ""];
  const about = [period ? `Period ${period}.` : "", clean(plan.community) ? `For: ${clean(plan.community)}.` : ""].filter(Boolean);
  if (about.length) lines.push(about.join(" "));
  lines.push("", "## Purpose", "", sentence(plan.purpose) || "_Not written yet._", "", "## Who are the users", "");
  const users = plan.users.filter((u) => clean(u.name));
  if (users.length === 0) lines.push("_Not written yet._", "");
  for (const u of users) lines.push(`**${upperFirst(clean(u.name))}:** ${sentence(u.cares) || "_What matters to them is not written yet._"}`, "");
  lines.push("## Product description", "", sentence(plan.idea) || "_Not written yet._", "", "## Features", "");
  const written = plan.stories.filter((s) => clean(s.iWant));
  if (written.length === 0) lines.push("_Not written yet._", "");
  // Two stories for one feature is one feature with two stories: list it once,
  // and both stories land on its screen by their shared heading.
  const listed = new Set<string>();
  written.forEach((s, i) => {
    const feature = featureName(s, i);
    if (listed.has(feature.toLowerCase())) return;
    listed.add(feature.toLowerCase());
    const want = stripLead(s.iWant, /^(i\s+)?(want|would like|need)\s+(to\s+)?/i);
    const who = lowerFirst(role(s.asA) || "user");
    const a = article(who);
    // The feature line is about them, while the story is in their own words.
    const theirs = lowerFirst(want).replace(/^be able to /i, "").replace(/\bmy\b/g, "their").replace(/\bme\b/g, "them").replace(/\bI\b/g, "they");
    lines.push(`**${feature}:** ${a[0].toUpperCase() + a.slice(1)} ${who} can ${theirs}.`, "");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** The stories as `user-stories.md`, one heading per feature so they land on the right screen. */
export function toUserStories(plan: LaunchPlan, teamName: string): string {
  const name = upperFirst(clean(plan.productName)) || `${teamName}'s idea`;
  const lines = [`# User stories for ${name}`, "", `Team: ${teamName}`, ""];
  plan.stories.forEach((s, i) => {
    if (!clean(s.iWant) && !clean(s.soThat)) return;
    lines.push(`## ${featureName(s, i)}`, "", storySentence(s), "");
    const criteria = s.criteria.map(clean).filter(Boolean);
    for (const c of criteria) lines.push(`  - ${c.replace(/[.]+$/, "")}`);
    if (criteria.length) lines.push("");
    // Indented Given/When/Then under the story, a blank line between each:
    // the generator turns When into a button and Then into what it does.
    const strip = (t: string, word: string) => clean(t).replace(new RegExp(`^${word}\\b[\\s,:]*`, "i"), "").replace(/[.]+$/, "");
    for (const sc of (s.scenarios ?? []).filter(scenarioIsWritten)) {
      lines.push(`  Given ${strip(sc.given, "given")}`, `  When ${strip(sc.when, "when")}`, `  Then ${strip(sc.then, "then")}`, "");
    }
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** The folder a team's documents go in under docs/launch. Period first so a class sorts together. */
export function exportFolder(period: number, key: string): string {
  return `p${period}-${key}`;
}

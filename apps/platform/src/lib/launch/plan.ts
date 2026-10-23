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

export interface LaunchStory {
  /** A short name for the feature this story asks for: "Photo search". */
  feature: string;
  asA: string;
  iWant: string;
  soThat: string;
  /** Bonus, for teams that get there: how we would know it works. */
  criteria: string[];
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
} as const;

export const STORY_GOAL = 3;
export const USER_GOAL = 2;

export function emptyStory(): LaunchStory {
  return { feature: "", asA: "", iWant: "", soThat: "", criteria: [] };
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
      return {
        feature: str(r.feature, LIMITS.short),
        asA: str(r.asA, LIMITS.short),
        iWant: str(r.iWant, LIMITS.sentence),
        soThat: str(r.soThat, LIMITS.sentence),
        criteria: criteria.map((c) => str(c, LIMITS.sentence)),
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

/** How far a team is, for the progress strip and the teacher's list. */
export function progress(plan: LaunchPlan) {
  const users = plan.users.filter((u) => u.name.trim() && u.cares.trim()).length;
  const stories = plan.stories.filter(storyIsWritten).length;
  return {
    purpose: plan.purpose.trim().length > 0,
    users,
    stories,
    criteria: plan.stories.filter((s) => storyIsWritten(s) && s.criteria.some((c) => c.trim())).length,
    done: plan.purpose.trim().length > 0 && users >= USER_GOAL && stories >= STORY_GOAL,
  };
}

/* --------------------------------------------------------------- export */

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const sentence = (s: string) => {
  const t = clean(s).replace(/[.!]+$/, "");
  return t ? `${t}.` : "";
};
/** "As a" text the way the sentence needs it: "students", not "Students". */
const role = (s: string) => singular(clean(s).replace(/^(a|an|the)\s+/i, ""));
/** Users are listed as groups ("Kids"), stories are about one of them ("As a kid"). */
function singular(s: string): string {
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
  if (clean(s.feature)) return clean(s.feature);
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
  const name = clean(plan.productName) || `${teamName}'s idea`;
  // A paragraph of its own: lines next to each other are one paragraph to the
  // parser, and "Team: The Lions Period: 3" is not the team's name.
  const lines = [`# ${name}`, "", `Team: ${teamName}`, ""];
  const about = [period ? `Period ${period}.` : "", clean(plan.community) ? `For: ${clean(plan.community)}.` : ""].filter(Boolean);
  if (about.length) lines.push(about.join(" "));
  lines.push("", "## Purpose", "", sentence(plan.purpose) || "_Not written yet._", "", "## Who are the users", "");
  const users = plan.users.filter((u) => clean(u.name));
  if (users.length === 0) lines.push("_Not written yet._", "");
  for (const u of users) lines.push(`**${clean(u.name)}:** ${sentence(u.cares) || "_What matters to them is not written yet._"}`, "");
  lines.push("## Product description", "", sentence(plan.idea) || "_Not written yet._", "", "## Features", "");
  const written = plan.stories.filter((s) => clean(s.iWant));
  if (written.length === 0) lines.push("_Not written yet._", "");
  written.forEach((s, i) => {
    const want = stripLead(s.iWant, /^(i\s+)?(want|would like|need)\s+(to\s+)?/i);
    const who = lowerFirst(role(s.asA) || "user");
    const a = article(who);
    // The feature line is about them, while the story is in their own words.
    const theirs = lowerFirst(want).replace(/\bmy\b/g, "their").replace(/\bme\b/g, "them").replace(/\bI\b/g, "they");
    lines.push(`**${featureName(s, i)}:** ${a[0].toUpperCase() + a.slice(1)} ${who} can ${theirs}.`, "");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** The stories as `user-stories.md`, one heading per feature so they land on the right screen. */
export function toUserStories(plan: LaunchPlan, teamName: string): string {
  const name = clean(plan.productName) || `${teamName}'s idea`;
  const lines = [`# User stories for ${name}`, "", `Team: ${teamName}`, ""];
  plan.stories.forEach((s, i) => {
    if (!clean(s.iWant) && !clean(s.soThat)) return;
    lines.push(`## ${featureName(s, i)}`, "", storySentence(s), "");
    const criteria = s.criteria.map(clean).filter(Boolean);
    for (const c of criteria) lines.push(`  - ${c.replace(/[.]+$/, "")}`);
    if (criteria.length) lines.push("");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** The folder a team's documents go in under docs/launch. Period first so a class sorts together. */
export function exportFolder(period: number, key: string): string {
  return `p${period}-${key}`;
}

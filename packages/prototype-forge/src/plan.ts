/**
 * Turns a parsed brief and a set of user stories into a prototype plan.
 *
 * Two decisions define this file.
 *
 * It is deterministic. No model runs here. The same brief always produces the
 * same prototype, which means a team can change one sentence, regenerate, and
 * see exactly what that sentence controls. A model in this seat would produce
 * something nicer and teach nothing, because the students could no longer tell
 * which part of the result was theirs.
 *
 * It does not fill gaps. A feature with no story becomes an empty screen that
 * says so. A story with no "so that" produces a button that admits nobody wrote
 * what happens next. The prototype is a mirror, and the coach notes are the
 * lesson plan: thin writing produces a thin app, visibly, in front of the team
 * that wrote it.
 */

import { plainText, slugify, titleCase } from "./parse";
import type {
  AppSpec,
  CoachNote,
  ElementSpec,
  Feature,
  PrototypeTheme,
  ProductBrief,
  ScreenSpec,
  UserStory,
  UserType,
} from "./types";

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Six palettes, chosen by the product name.
 *
 * Every team gets a look that is theirs and is stable across regenerations,
 * without anyone picking colors. Visual identity is a later lesson, and this
 * keeps the gallery from being a wall of identical grey boxes today.
 */
const PALETTES: PrototypeTheme[] = [
  { primary: "#630031", accent: "#cf4420", surface: "#fdfbf8", text: "#1c1a19", muted: "#75787b", headingFont: "Georgia, 'Times New Roman', serif", bodyFont: "system-ui, -apple-system, sans-serif" },
  { primary: "#14532d", accent: "#f59e0b", surface: "#f8faf7", text: "#14201a", muted: "#5d6b62", headingFont: "Georgia, 'Times New Roman', serif", bodyFont: "system-ui, -apple-system, sans-serif" },
  { primary: "#1e3a8a", accent: "#06b6d4", surface: "#f7f9fd", text: "#111827", muted: "#5b6478", headingFont: "'Trebuchet MS', system-ui, sans-serif", bodyFont: "system-ui, -apple-system, sans-serif" },
  { primary: "#6b21a8", accent: "#ec4899", surface: "#fdf9fe", text: "#1f142a", muted: "#6f6280", headingFont: "'Trebuchet MS', system-ui, sans-serif", bodyFont: "system-ui, -apple-system, sans-serif" },
  { primary: "#9a3412", accent: "#0d9488", surface: "#fffaf6", text: "#231610", muted: "#7a675c", headingFont: "Georgia, 'Times New Roman', serif", bodyFont: "system-ui, -apple-system, sans-serif" },
  { primary: "#0f766e", accent: "#f43f5e", surface: "#f6fbfa", text: "#0f1f1d", muted: "#5c706d", headingFont: "'Trebuchet MS', system-ui, sans-serif", bodyFont: "system-ui, -apple-system, sans-serif" },
];

function pickTheme(seed: string): PrototypeTheme {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

// ---------------------------------------------------------------------------
// Matching stories to features
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "a", "an", "and", "the", "to", "of", "for", "in", "on", "at", "my", "me", "i",
  "it", "is", "be", "can", "so", "that", "with", "as", "we", "you", "they",
  "want", "need", "would", "like", "able", "user", "users", "app", "page",
  "screen", "see", "get", "have", "this", "their", "them", "or", "if", "when",
  "then", "given", "will", "should", "could", "new", "all", "your", "from",
]);

function significantWords(text: string): Set<string> {
  const words = plainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n += 1;
  return n;
}

/**
 * Assign each story to the feature it best matches.
 *
 * The heading a story sat under wins outright when it names a feature, because
 * that is the team saying so. Otherwise it is word overlap, and a story that
 * matches nothing stays unassigned rather than being forced somewhere: an
 * unassigned story is a real finding, usually a feature the team built stories
 * for but never listed in the plan.
 */
export function assignStories(
  features: Feature[],
  stories: UserStory[],
): { byFeature: Map<string, UserStory[]>; orphans: UserStory[] } {
  const byFeature = new Map<string, UserStory[]>();
  for (const feature of features) byFeature.set(feature.name, []);
  const orphans: UserStory[] = [];

  const featureWords = features.map((f) => ({
    name: f.name,
    words: significantWords(`${f.name} ${f.description ?? ""}`),
  }));

  for (const story of stories) {
    const hinted = story.featureHint
      ? features.find(
          (f) =>
            f.name.toLowerCase() === story.featureHint?.toLowerCase() ||
            significantWords(f.name).size > 0 &&
              overlap(significantWords(f.name), significantWords(story.featureHint ?? "")) > 0,
        )
      : undefined;
    if (hinted) {
      byFeature.get(hinted.name)?.push(story);
      continue;
    }

    const storyWords = significantWords(
      `${story.want} ${story.soThat ?? ""} ${story.scenarios.map((s) => s.raw).join(" ")}`,
    );
    // Two shared words, not one. A feature description is a whole sentence, so
    // one shared word is nearly always incidental: "biking" appears in the shop
    // description and in a sign-in story about someone "interested in mountain
    // biking", which filed sign-in under the shop. Being unassigned is the
    // safer failure, because an unassigned story gets its own screen and a note
    // rather than quietly appearing under the wrong feature.
    let best: { name: string; score: number } | null = null;
    for (const f of featureWords) {
      const score = overlap(f.words, storyWords);
      if (score >= 2 && (!best || score > best.score)) best = { name: f.name, score };
    }
    if (best) byFeature.get(best.name)?.push(story);
    else orphans.push(story);
  }

  return { byFeature, orphans };
}

// ---------------------------------------------------------------------------
// Turning a story into screen elements
// ---------------------------------------------------------------------------

const INPUT_VERBS = /\b(type|types|typing|enter|enters|fill|fills|write|writes|upload|uploads|choose|chooses|select|selects|pick|picks|set|sets|input|add|adds)\b/i;
const ACTION_VERBS = /\b(tap|taps|click|clicks|press|presses|submit|submits|send|sends|save|saves|open|opens|start|starts|join|joins|post|posts|delete|deletes|confirm|confirms|button)\b/i;
const DATE_WORDS = /\b(date|day|deadline|due|schedule|when|time)\b/i;
const CHOICE_WORDS = /\b(choose|chooses|select|selects|pick|picks|option|options|category|type of|from a list|dropdown)\b/i;
const LONG_TEXT_WORDS = /\b(describe|description|message|comment|note|notes|review|story|paragraph|explain)\b/i;

/**
 * Trim a sentence down to something that fits on a control.
 *
 * Sentence casing happens before the cut, because titleCase strips trailing
 * punctuation and was eating the ellipsis it had just been given, leaving
 * buttons that read "Receive a message and coordinate with the b" as though
 * that were the whole label. The cut also falls back to the last word boundary,
 * so a truncated label ends on a word.
 */
function phrase(text: string, max = 52): string {
  const cleaned = titleCase(
    plainText(text)
      .replace(/^(the\s+)?(user|users|student|players?|people|they|she|he|i|we)\s+/i, "")
      .replace(/^(can|should|will|would|is able to|are able to)\s+/i, "")
      .trim(),
  );
  if (cleaned.length <= max) return cleaned;

  const cut = cleaned.slice(0, max - 3);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s,;:]+$/, "")}...`;
}

/** Guess the control a "the user enters X" sentence is asking for. */
function controlFor(text: string): "text" | "textarea" | "select" | "date" | "toggle" {
  if (DATE_WORDS.test(text)) return "date";
  if (LONG_TEXT_WORDS.test(text)) return "textarea";
  if (CHOICE_WORDS.test(text)) return "select";
  return "text";
}

/**
 * Build the controls for one story.
 *
 * Every scenario becomes something a visitor can touch, and the Then clause is
 * what the control says back. That is the whole trick of this generator: the
 * team's acceptance criteria are not documentation sitting beside the demo,
 * they are the demo.
 */
function storyElements(
  story: UserStory,
  screenIds: Map<string, string>,
  currentScreenId?: string,
): ElementSpec[] {
  const elements: ElementSpec[] = [];

  elements.push({
    kind: "card",
    title: titleCase(story.want),
    body: story.soThat ? `So that ${story.soThat}` : undefined,
    meta: story.role ? `For: ${story.role}` : undefined,
  });

  if (story.scenarios.length === 0) {
    elements.push({
      kind: "note",
      text: `Story ${story.id} has no acceptance criteria yet, so there is nothing to click here. Add a Given, When and Then and this screen fills in.`,
    });
    return elements;
  }

  for (const scenario of story.scenarios) {
    const source = `${scenario.given ?? ""} ${scenario.when ?? ""} ${scenario.raw}`;
    const result = scenario.then ?? "";

    if (scenario.given && !scenario.when && !scenario.then) {
      elements.push({ kind: "note", text: titleCase(scenario.given) });
    }

    const trigger = scenario.when ?? (ACTION_VERBS.test(scenario.raw) || INPUT_VERBS.test(scenario.raw) ? scenario.raw : null);

    if (trigger && INPUT_VERBS.test(trigger) && !ACTION_VERBS.test(trigger)) {
      elements.push({ kind: "field", label: phrase(trigger, 44), control: controlFor(trigger) });
      continue;
    }

    if (trigger) {
      const target = targetScreen(result || trigger, screenIds, currentScreenId);
      elements.push({
        kind: "button",
        label: phrase(trigger, 44),
        to: target,
        // Prefixed with the vocabulary word on purpose: pressing a button and
        // reading back your own Then clause is the shortest route to why the
        // clause exists.
        says: target
          ? undefined
          : result
            ? `Then: ${result.replace(/[.]+$/, "")}`
            : `Nobody wrote what happens next. Add a "Then" to story ${story.id}.`,
        primary: true,
      });
      continue;
    }

    // No trigger to press: the scenario is describing what the screen shows.
    elements.push({ kind: "note", text: phrase(scenario.then ?? scenario.raw, 140) });
  }

  return elements;
}

/**
 * Link a button onward only when the outcome clearly names another screen.
 *
 * The bar is two shared words, and the current screen is excluded. One shared
 * word sends "every rider on my route is told the new time" to the Route Board,
 * which is wrong and, worse, hides the team's own Then clause behind a
 * navigation that looks deliberate. Below the bar the button says the Then
 * clause instead, which is both honest and the more useful thing to read.
 */
function targetScreen(
  text: string,
  screenIds: Map<string, string>,
  exclude?: string,
): string | undefined {
  const words = significantWords(text);
  let best: { id: string; score: number } | null = null;
  for (const [title, id] of screenIds) {
    if (id === exclude) continue;
    const score = overlap(significantWords(title), words);
    if (score >= 2 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id;
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

export function planPrototype(brief: ProductBrief, stories: UserStory[]): AppSpec {
  const theme = pickTheme(brief.productName);
  const { byFeature, orphans } = assignStories(brief.features, stories);

  // Roles come from the plan. When the plan has none but the stories do, the
  // stories are the better source, and the mismatch becomes a coach note.
  const storyRoles = [...new Set(stories.map((s) => s.role).filter(Boolean))];
  const roles: UserType[] =
    brief.users.length > 0 ? brief.users : storyRoles.map((name) => ({ name }));

  const screens: ScreenSpec[] = [];

  // Screen ids are resolved before elements are built, so a button written in
  // one story can point at a screen defined by another.
  const screenIds = new Map<string, string>();
  for (const feature of brief.features) screenIds.set(feature.name, `feature-${slugify(feature.name)}`);
  for (const story of orphans) screenIds.set(story.want, `story-${slugify(story.id)}`);

  // Home.
  const homeElements: ElementSpec[] = [];
  if (brief.purpose) homeElements.push({ kind: "text", text: brief.purpose });
  else homeElements.push({ kind: "note", text: "Your plan does not say what this product is for yet. Write the purpose and it appears here." });
  if (brief.description) homeElements.push({ kind: "text", text: brief.description });
  if (brief.features.length > 0) {
    for (const feature of brief.features) {
      homeElements.push({
        kind: "card",
        title: feature.name,
        body: feature.description,
        to: screenIds.get(feature.name),
        meta: count(byFeature.get(feature.name)?.length ?? 0, "story", "stories"),
      });
    }
  } else {
    homeElements.push({ kind: "note", text: "No features are listed in your plan, so there is nothing to open. Add features and each one becomes a screen." });
  }
  screens.push({
    id: "home",
    title: "Home",
    subtitle: brief.purpose ? undefined : "Purpose missing",
    roles: [],
    inNav: true,
    elements: homeElements,
    source: { kind: "core", label: "Product purpose and feature list, from your plan" },
  });

  // One screen per feature.
  for (const feature of brief.features) {
    const featureStories = byFeature.get(feature.name) ?? [];
    const elements: ElementSpec[] = [];
    if (feature.description) elements.push({ kind: "text", text: feature.description });
    if (featureStories.length === 0) {
      elements.push({
        kind: "note",
        text: `No user story points at "${feature.name}" yet, so this screen is empty. Write a story and this screen fills in.`,
      });
    }
    const screenId = screenIds.get(feature.name) as string;
    for (const story of featureStories) elements.push(...storyElements(story, screenIds, screenId));

    screens.push({
      id: screenId,
      title: feature.name,
      subtitle: featureStories.length === 0 ? "Waiting on a user story" : undefined,
      roles: [...new Set(featureStories.map((s) => canonicalRole(s.role, roles)).filter(Boolean))],
      inNav: true,
      elements,
      source: {
        kind: "feature",
        ref: feature.name,
        label:
          featureStories.length > 0
            ? `Feature "${feature.name}", built from ${featureStories.map((s) => s.id).join(", ")}`
            : `Feature "${feature.name}", with no story yet`,
      },
    });
  }

  // Stories that matched no feature still deserve a screen. They are usually
  // the most interesting finding in the whole document.
  //
  // When the plan listed no features at all, which happens when a team wrote
  // stories before the plan or never handed the plan in, every story lands
  // here. Keeping them out of the navigation would leave that team with a
  // prototype they cannot open, so in that case the stories are the navigation.
  const storiesAreTheNav = brief.features.length === 0;
  for (const story of orphans) {
    screens.push({
      id: screenIds.get(story.want) as string,
      title: phrase(story.want, 28),
      subtitle: storiesAreTheNav ? "From a user story" : "Not in your feature list",
      roles: story.role ? [canonicalRole(story.role, roles)] : [],
      inNav: storiesAreTheNav,
      elements: storyElements(story, screenIds, screenIds.get(story.want)),
      source: {
        kind: "story",
        ref: story.id,
        label: `Story ${story.id}, which does not match any feature in your plan`,
      },
    });
  }

  // Who this is for.
  const peopleElements: ElementSpec[] = [];
  if (roles.length > 0) {
    for (const role of roles) {
      peopleElements.push({
        kind: "card",
        title: role.name,
        body: role.description,
        meta: `${count(stories.filter((s) => sameRole(s.role, role.name)).length, "story", "stories")} written for this user`,
      });
    }
  } else {
    peopleElements.push({ kind: "note", text: "Your plan does not name any users yet. Every product is for somebody. Say who." });
  }
  screens.push({
    id: "people",
    title: "Who this is for",
    roles: [],
    inNav: true,
    elements: peopleElements,
    source: { kind: "core", label: "The users section of your plan" },
  });

  const scenarioCount = stories.reduce((n, s) => n + s.scenarios.length, 0);

  // How this was made: the traceability screen, and the reason the prototype
  // is a teaching tool rather than a toy.
  const madeElements: ElementSpec[] = [
    { kind: "text", text: "Every screen in this prototype came from something your team wrote. Nothing here was invented for you." },
    { kind: "stat", label: "Features in your plan", value: String(brief.features.length) },
    { kind: "stat", label: "User stories", value: String(stories.length) },
    { kind: "stat", label: "Acceptance criteria", value: String(scenarioCount) },
    { kind: "stat", label: "Screens generated", value: String(screens.length + 1) },
    {
      kind: "list",
      heading: "Where each screen came from",
      items: screens.map((s) => `${s.title}: ${s.source.label}`),
    },
  ];
  screens.push({
    id: "how",
    title: "How this was made",
    roles: [],
    inNav: true,
    elements: madeElements,
    source: { kind: "core", label: "Generated from the structure of your documents" },
  });

  return {
    productName: brief.productName,
    teamName: brief.teamName,
    isDraft: brief.isDraft,
    tagline: brief.purpose || brief.description || "A prototype built from your product plan.",
    roles,
    viewAs: [
      ...new Set([
        ...roles.map((r) => r.name),
        ...stories.map((s) => canonicalRole(s.role, roles)).filter(Boolean),
      ]),
    ],
    screens,
    theme,
    notes: coachNotes(brief, stories, byFeature, orphans, roles),
    stats: {
      features: brief.features.length,
      stories: stories.length,
      scenarios: scenarioCount,
      screens: screens.length,
    },
  };
}

/** "1 story" rather than "1 stories". Small, and students notice. */
function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Map a role as written in a story onto the user type as written in the plan.
 *
 * Teams write "As a bus driver" in a story and "Bus drivers" in the plan, which
 * is correct English in both places and two different strings. Without this the
 * "view as" switcher hides the driver's own screen from the driver, which reads
 * as a broken prototype and is really just plural nouns.
 */
function canonicalRole(role: string, roles: UserType[]): string {
  const match = roles.find((r) => sameRole(r.name, role));
  return match ? match.name : role;
}

function sameRole(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/s$/, "").trim();
  return norm(a) === norm(b);
}


/**
 * Roles that name nobody.
 *
 * Every team wrote their plan about mountain bikers or rural households and
 * then wrote every story about "a user". That slip is worth one good note,
 * because naming the actual person changes what the screen has to do. It is not
 * worth one note per story, which is what it was producing: seven near
 * identical lines that buried the two findings that mattered.
 */
const GENERIC_ROLES: ReadonlySet<string> = new Set([
  "user", "users", "consumer", "consumers", "customer", "customers", "person",
  "people", "app user", "someone", "somebody", "me", "i", "you", "player",
]);

function isGenericRole(role: string): boolean {
  return GENERIC_ROLES.has(role.trim().toLowerCase().replace(/^(a|an|the)\s+/, ""));
}

/** One note for a set of stories sharing a problem, rather than one note each. */
function groupedNote(
  subjects: Array<{ id: string }>,
  level: CoachNote["level"],
  message: (ids: string, single: boolean) => string,
): CoachNote[] {
  if (subjects.length === 0) return [];
  const ids = subjects.map((s) => s.id).join(", ");
  return [{ level, message: message(ids, subjects.length === 1), where: "User stories" }];
}

/**
 * How the stories' roles line up with the plan's user types.
 *
 * Three separate findings, each said once: stories written for nobody in
 * particular, stories written for somebody the plan never named, and user types
 * the plan named but nobody wrote for.
 */
function roleNotes(stories: UserStory[], roles: UserType[]): CoachNote[] {
  const notes: CoachNote[] = [];
  if (roles.length === 0) return notes;

  const named = roles.map((r) => r.name);
  const generic = stories.filter((s) => s.role && isGenericRole(s.role));
  if (generic.length > 0) {
    notes.push({
      level: "tip",
      message: `${generic.length === stories.length ? "Every one of your stories is" : `${generic.length} of your stories ${generic.length === 1 ? "is" : "are"}`} written for a generic "user" rather than the people your plan names: ${named.join(", ")}. Naming the real person changes what the screen has to do.`,
      where: "User stories",
    });
  }

  const unknown = stories.filter(
    (s) => s.role && !isGenericRole(s.role) && !roles.some((r) => sameRole(r.name, s.role)),
  );
  if (unknown.length > 0) {
    const list = [...new Set(unknown.map((s) => `"${s.role}"`))].join(", ");
    notes.push({
      level: "tip",
      message: `Some stories are written for people your plan does not list: ${list}. Add them to your users, or rewrite the story for someone you did list.`,
      where: "User stories",
    });
  }

  const unserved = roles.filter((r) => !stories.some((s) => sameRole(s.role, r.name)));
  if (unserved.length > 0 && unserved.length < roles.length) {
    notes.push({
      level: "tip",
      message: `You named ${unserved.map((r) => `"${r.name}"`).join(", ")} as users but wrote no stories for them.`,
      where: "Who this is for",
    });
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Coach notes
// ---------------------------------------------------------------------------

/**
 * What the team should fix next, in their own document's terms.
 *
 * Ordered gaps first, then wins. A team that opens the coach panel should see
 * a to-do list they can act on in the next class period, not a grade.
 */
export function coachNotes(
  brief: ProductBrief,
  stories: UserStory[],
  byFeature: Map<string, UserStory[]>,
  orphans: UserStory[],
  roles: UserType[],
): CoachNote[] {
  const notes: CoachNote[] = [];

  const planIsEmpty =
    !brief.purpose && !brief.description && brief.users.length === 0 && brief.features.length === 0;

  if (planIsEmpty) {
    // Four notes all reporting "there is no plan" is one note repeated four
    // times, and a panel of repeats is a panel nobody reads. Say it once.
    notes.push({
      level: "gap",
      message:
        "There is no product plan here, only stories. Write the purpose, who the users are, what the product is, and the feature list, and the rest of this prototype appears.",
      where: "Product plan",
    });
  } else {
    if (!brief.purpose) notes.push({ level: "gap", message: "Your plan has no product purpose. One sentence on why this should exist.", where: "Product plan" });
    if (!brief.description) notes.push({ level: "gap", message: "Your plan has no product description. Describe what it is to somebody who has never seen it.", where: "Product plan" });
    if (brief.users.length === 0) notes.push({ level: "gap", message: "Your plan does not name any users. Who is this for?", where: "Product plan" });
    if (brief.features.length === 0) notes.push({ level: "gap", message: "Your plan lists no features, so the prototype has no screens to open.", where: "Product plan" });
  }

  if (brief.productNameIsFallback) {
    notes.push({
      level: "gap",
      message: `Your plan never names the product, so this prototype is titled "${brief.productName}". Give the app a name of its own and the title follows.`,
      where: "Product plan",
    });
  }

  if (stories.length === 0) {
    notes.push({ level: "gap", message: "No user stories were found. A story looks like: As a student, I want to save my work, so that I do not lose it.", where: "User stories" });
  }

  // One note per unwritten feature is fine for a team with two of them and
  // useless for a team with fifteen: CTOS listed 17 features and wrote 2
  // stories, and the resulting wall of identical lines buried everything else
  // in the panel. Past a handful, say it once and name them.
  const unwritten = [...byFeature].filter(([, list]) => list.length === 0).map(([name]) => name);
  if (unwritten.length > 0 && unwritten.length <= 3) {
    for (const name of unwritten) {
      notes.push({ level: "gap", message: `Feature "${name}" has no user story, so its screen is empty.`, where: name });
    }
  } else if (unwritten.length > 3) {
    notes.push({
      level: "gap",
      message: `${unwritten.length} of your ${byFeature.size} features have no user story, so their screens are empty: ${unwritten.join(", ")}. Pick the three that matter most and write stories for those.`,
      where: "Features",
    });
  }

  notes.push(...groupedNote(stories.filter((s) => !s.soThat), "gap", (ids, one) =>
    one
      ? `Story ${ids} has no "so that" clause, so nobody knows why it matters.`
      : `These stories have no "so that" clause: ${ids}. Without it nobody knows why the feature matters.`,
  ));

  notes.push(...groupedNote(stories.filter((s) => s.scenarios.length === 0), "gap", (ids, one) =>
    one
      ? `Story ${ids} has no acceptance criteria, so there is nothing to click.`
      : `These stories have no acceptance criteria: ${ids}. Their screens have nothing to click.`,
  ));

  // Deliberately the plan's users, not the fallback roles derived from the
  // stories. With no plan the fallback is the story roles themselves, and the
  // note would tell a team to stop writing "user" and write "user" instead.
  notes.push(...roleNotes(stories, brief.users));

  if (brief.features.length > 0) {
    notes.push(...groupedNote(orphans, "tip", (ids, one) =>
      one
        ? `Story ${ids} does not match any feature in your plan. It may be a feature you forgot to list.`
        : `These stories match no feature in your plan: ${ids}. They may be features you forgot to list.`,
    ));
  }

  const covered = [...byFeature.values()].filter((l) => l.length > 0).length;
  if (brief.features.length > 0 && covered === brief.features.length) {
    notes.push({ level: "win", message: "Every feature in your plan has at least one user story. That is the hard part done.", where: "User stories" });
  }
  const withCriteria = stories.filter((s) => s.scenarios.length > 0).length;
  if (stories.length > 0 && withCriteria === stories.length) {
    notes.push({ level: "win", message: "Every story has acceptance criteria, which is why this prototype is clickable.", where: "User stories" });
  }

  return notes;
}

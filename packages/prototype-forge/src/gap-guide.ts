/**
 * The gap guide: what a team still has to do, in the order it has to happen.
 *
 * Every other page in the chain answers "how". A team that is stuck usually is
 * not stuck on how, they are stuck on *which thing next*, and that question has
 * a real answer that nobody has been giving them: the chain is ordered, and a
 * step you skipped is the reason the next one will not work.
 *
 * Derived, never written, for the same reason the prototype and the test plan
 * are. A hand-written gap guide would be a teacher's judgement of a team, would
 * be out of date the day after it was written, and would read the same whether
 * the team fixed anything or not. Derived by rule, it gets visibly shorter as
 * they work, which is the only reward a document like this can offer.
 *
 * It leans on `coachNotes` for everything about the plan and the stories rather
 * than checking those again here. One source of truth per fact: if the note
 * changes, this page changes with it, and the two can never disagree in front
 * of a student.
 */

import type { CoachNote, ProductBrief, UserStory } from "./types";
import { parseArchitecture } from "./design";
import { planFromStory } from "./story-kit";

/**
 * The chain, in order. A team is always on exactly one of these, and it is the
 * first one they have not finished rather than the furthest one they have
 * touched. Starting the architecture does not mean the stories are done.
 */
export type Stage = "plan" | "stories" | "cards" | "architecture" | "build";

export const STAGES: Stage[] = ["plan", "stories", "cards", "architecture", "build"];

export const STAGE_LABEL: Record<Stage, string> = {
  plan: "Product plan",
  stories: "User stories",
  cards: "Build cards",
  architecture: "Architecture",
  build: "Figma and Anvil",
};

/**
 * How much a gap is in the way.
 *
 * `blocking` means the next step cannot honestly be done until this is. `soon`
 * means it will bite during the step they are on. `later` is real and can wait,
 * and it is on the page so that a team can see the whole road rather than only
 * the next bend.
 */
export type Weight = "blocking" | "soon" | "later";

export interface Gap {
  id: string;
  stage: Stage;
  weight: Weight;
  /** What is missing, in one line. */
  title: string;
  /** Why it matters. Never "because you have to". */
  why: string;
  /**
   * What to actually do, concretely enough to start now.
   *
   * Absent for gaps that came from a coach note, because those notes already
   * end in what to do and a generic "open your plan" underneath one only made
   * the page repeat itself in worse words.
   */
  fix?: string;
  /** The document, feature or story it is about. */
  where?: string;
}

export interface GapReport {
  productName: string;
  teamName?: string;
  /** The step they are on: the first one not finished. */
  stage: Stage;
  /** The single next thing. One, deliberately. */
  next: Gap | null;
  gaps: Gap[];
  /** What is already true, so the page is not only a list of failures. */
  done: string[];
  counts: {
    features: number;
    stories: number;
    cards: number;
    screens: number;
    components: number;
  };
}

export interface GapInput {
  brief: ProductBrief;
  stories: UserStory[];
  /** From the planner. The plan and story gaps are already in here. */
  notes: CoachNote[];
  cards?: string;
  architecture?: string;
  dataTables?: string;
  hasCodeGuide?: boolean;
  /** Set when the stories changed after the cards were last touched. */
  staleSince?: string;
}

// ---------------------------------------------------------------------------
// Small readers. Each one answers a single question about a document.
// ---------------------------------------------------------------------------

/** `## Card 3: Add points` and friends. Counts what a team has written. */
function countCards(cards: string): number {
  return (cards.match(/^##\s+Card\b/gim) ?? []).length;
}

/** Whether the architecture ever says which patterns a feature needs. */
function namesPatterns(architecture: string): boolean {
  return /\bpatterns?\b[^\n]*\*\*\d+\*\*|\bPattern\s+\d+/i.test(architecture);
}

/**
 * Whether the architecture has a data table section with anything under it.
 *
 * A heading with nothing beneath it is the common case and the misleading one:
 * the document looks complete and the section is empty.
 */
function specifiesTables(architecture: string): boolean {
  const section = architecture.split(/^##\s+/m).find((s) => /^data tables?\b/i.test(s));
  if (!section) return false;
  return /^[-*|]/m.test(section.split("\n").slice(1).join("\n"));
}

/** Words in a story that mean the app has to remember something. */
const SAVING = /\b(sav\w*|stor\w*|add\w*|record\w*|keep\w*|submit\w*|post\w*|upload\w*)\b/i;

function storiesNeedATable(stories: UserStory[]): boolean {
  return stories.some((s) => SAVING.test(s.want) || s.scenarios.some((sc) => SAVING.test(sc.raw)));
}

/**
 * The features the architecture parked on purpose.
 *
 * These are not failures and the page has to say so. They are on it because a
 * team that cannot see the parked work assumes it was forgotten, and then one
 * of them starts building it in week three instead of the slice.
 */
function stubbedFeatures(architecture: string): string[] {
  const lines = architecture.split(/\r?\n/);
  const start = lines.findIndex((l) => /^\*\*Stubbed\b/i.test(l.trim()));
  if (start === -1) return [];
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    // Only the top level bullet, and only its bold lead, which is the name of
    // the thing. The sentences under it are the reason and belong on the
    // architecture page rather than repeated here.
    const m = line.match(/^-\s+\*\*(.+?)\.?\*\*/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

/** Stories whose criteria produce no test at all. Nothing to build towards. */
function untestableStories(stories: UserStory[]): UserStory[] {
  return stories.filter((s) => {
    if (s.scenarios.length === 0) return false; // already a coach note
    return planFromStory(s).cases.length === 0;
  });
}

// ---------------------------------------------------------------------------
// Turning a coach note into a gap
// ---------------------------------------------------------------------------

/**
 * Which stage a coach note belongs to, from what it is about.
 *
 * The notes carry a `where` naming the document, which is the honest signal.
 * Anything unrecognised is a story gap, because that is where the planner's
 * notes overwhelmingly live and a misfiled gap is still a gap on the page.
 */
function stageOfNote(note: CoachNote): Stage {
  // Only "Product plan" is a plan gap. A note filed under a feature name, or
  // under "Features", is saying that feature has no story, which is work that
  // happens in the story studio. Matching on "feature" sent CTOS's fifteen
  // unwritten features to the plan step and left the team being told to go and
  // name their product instead.
  return /\bplan\b/.test((note.where ?? "").toLowerCase()) ? "plan" : "stories";
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export function findGaps(input: GapInput): GapReport {
  const { brief, stories, notes, cards, architecture, dataTables } = input;
  const gaps: Gap[] = [];
  const done: string[] = [];
  let n = 0;
  const add = (g: Omit<Gap, "id">) => gaps.push({ id: `G${++n}`, ...g });

  const spec = architecture ? parseArchitecture(architecture) : undefined;
  const screens = spec?.screens ?? [];
  const components = screens.reduce((sum, s) => sum + s.components.length, 0);
  const cardCount = cards ? countCards(cards) : 0;

  // --- The step they are on -------------------------------------------------
  const planStarted =
    !!brief.purpose || !!brief.description || brief.users.length > 0 || brief.features.length > 0;
  const stage: Stage = !planStarted
    ? "plan"
    : stories.length === 0
      ? "stories"
      : cards === undefined
        ? "cards"
        : architecture === undefined
          ? "architecture"
          : "build";

  // --- Everything the planner already found ---------------------------------
  for (const note of notes) {
    if (note.level === "win") {
      done.push(note.message);
      continue;
    }
    if (note.level !== "gap" && note.level !== "tip") continue;
    // Passed through whole. A coach note is one carefully written sentence that
    // already says what is missing and what it costs; cutting it in half to
    // fill two fields here produced a fragment starting with "so".
    //
    // A tip is a gap that does not stop anything, and the most valuable finding
    // this whole page makes is one: a team that named two kinds of user in
    // their plan and wrote every story for only one of them.
    //
    // A plan gap only blocks while the team is still on the plan. Once they are
    // writing stories, a plan with no product name in it is a real debt and it
    // is not what is stopping them: CTOS had fifteen features with no story and
    // was being sent off to think of an app name.
    const noteStage = stageOfNote(note);
    add({
      stage: noteStage,
      weight:
        note.level === "tip" || (noteStage === "plan" && stage !== "plan") ? "soon" : "blocking",
      title: note.message,
      why: "",
      where: note.where,
    });
  }

  // --- Stories that cannot be tested ---------------------------------------
  // Different from having no criteria, which the planner already catches. These
  // teams did the work and wrote criteria nobody can check, which feels like
  // being finished and is the more expensive mistake of the two.
  const vague = untestableStories(stories);
  if (vague.length > 0) {
    add({
      stage: "stories",
      weight: "soon",
      title: `${vague.length === 1 ? "One story has" : `${vague.length} stories have`} criteria nobody could check.`,
      why: "A criterion like \"good user interface\" cannot be true or false, so it cannot tell you when you are finished, and it will not appear on your test plan.",
      fix: "Rewrite each one as something a person could watch happen. Not \"it is fun\", but \"a message appears within a second of tapping\".",
      where: vague.map((s) => s.id).join(", "),
    });
  }

  // --- Build cards ----------------------------------------------------------
  if (stories.length > 0 && cards === undefined) {
    add({
      stage: "cards",
      weight: "blocking",
      title: "You have stories but no build cards.",
      why: "A card is a story with its finish line attached, and it is what stops a feature being called done by whoever gets bored first.",
      fix: "Sit down with your teacher and turn each story into a card: the story, the boxes that have to be ticked, and where to build it.",
      where: "Build cards",
    });
  } else if (cards !== undefined && cardCount === 0) {
    add({
      stage: "cards",
      weight: "blocking",
      title: "Your build cards page has no cards on it.",
      why: "The page exists, so everything downstream assumes there is something on it.",
      fix: "Each card is a `## Card N:` heading, the story, and a list of what has to be true.",
      where: "Build cards",
    });
  } else if (cards !== undefined && cardCount < stories.length) {
    add({
      stage: "cards",
      weight: "soon",
      title: `You have ${stories.length} stories and ${cardCount} cards.`,
      why: "A story with no card has no finish line, so nobody can say whether it is built.",
      fix: "Work out which stories are missing a card. Some may deserve to be dropped, and dropping one on purpose is a decision worth writing down.",
      where: "Build cards",
    });
  }

  if (input.staleSince) {
    add({
      stage: "cards",
      weight: "blocking",
      title: `Your stories changed on ${input.staleSince} and your cards have not caught up.`,
      why: "The prototype and the test plan rebuilt themselves. The cards and the architecture did not, because which patterns a feature needs is a judgement and a machine should not be making it for you.",
      fix: "Read the changed story, then check the card and the architecture still match it. Put `Card updated:` and today's date at the top of the cards page.",
      where: "Build cards",
    });
  }

  // --- Architecture ---------------------------------------------------------
  if (cards !== undefined && architecture === undefined) {
    add({
      stage: "architecture",
      weight: "blocking",
      title: "You have cards but no architecture page.",
      why: "Every blank in the Pattern Book is a name from your architecture. Without it the code in the Pattern Book cannot be used by anybody, including you.",
      fix: "List your screens, then every component on each screen with the exact name you will use, then which patterns each feature needs and in what order.",
      where: "Architecture",
    });
  }

  if (architecture !== undefined) {
    if (screens.length === 0) {
      add({
        stage: "architecture",
        weight: "blocking",
        title: "Your architecture names no screens.",
        why: "Screens are what your designer draws frames for and what your builder creates forms for. Nobody can start without them.",
        fix: "Add a table of screens: the form name, what it is, and who sees it.",
        where: "Architecture",
      });
    } else if (components === 0) {
      add({
        stage: "architecture",
        weight: "blocking",
        title: "Your architecture has screens but no component names.",
        why: "The component names are the whole point of the page. They are what fills the blanks in the Pattern Book and what your designer names their Figma layers.",
        fix: "Under each screen, list every button, label and box with the exact name, like `btn_save` and `lbl_total`.",
        where: "Architecture",
      });
    }

    if (screens.length > 0 && !namesPatterns(architecture)) {
      add({
        stage: "architecture",
        weight: "soon",
        title: "Your architecture never says which patterns a feature needs.",
        why: "Knowing a feature is Pattern 1, then 2, then 6, then 7 is the difference between building it and staring at it.",
        fix: "For each feature, write the pattern numbers in the order they happen. Read the Pattern Book and decide as a team.",
        where: "Architecture",
      });
    }

    if (storiesNeedATable(stories) && !specifiesTables(architecture)) {
      add({
        stage: "architecture",
        weight: "blocking",
        title: "Your stories say the app remembers things, and your architecture does not say where.",
        why: "Anything that has to still be there tomorrow lives in a Data Table, and the table's shape decides which questions you can ask later.",
        fix: "Add a data tables section: each table, each column, and what type it is. Your teacher creates them and tells you the exact names.",
        where: "Architecture",
      });
    }

    const stubbed = stubbedFeatures(architecture);
    if (stubbed.length > 0) {
      add({
        stage: "architecture",
        weight: "later",
        title: `${stubbed.length} ${stubbed.length === 1 ? "feature is" : "features are"} parked on purpose: ${stubbed.join(", ")}.`,
        why: "Nobody forgot these. Your architecture page says why each one is out of the slice, and deciding what not to build is a professional skill rather than giving up.",
        fix: "When the slice works, read the reason one was parked. If you can argue it back in, do that, and tell your teacher why you changed your mind.",
      });
    }
  }

  // --- What is already true -------------------------------------------------
  if (brief.features.length > 0) done.push(`Your plan lists ${brief.features.length} features.`);
  if (stories.length > 0) done.push(`You have written ${stories.length} user ${stories.length === 1 ? "story" : "stories"}.`);
  if (cardCount > 0) {
    done.push(`You have ${cardCount} build ${cardCount === 1 ? "card" : "cards"}, each with a finish line on it.`);
  }
  if (screens.length > 0) {
    done.push(
      `Your architecture names ${screens.length} screens and ${components} components, so your design brief and your Pattern Book blanks are both filled in.`,
    );
  }
  if (dataTables) done.push("Your data tables are specified, so you can build anything that has to be remembered.");
  if (input.hasCodeGuide) done.push("You have a project code guide, with your own names already in it.");

  // --- Order, and the one next thing ---------------------------------------
  const WEIGHT: Record<Weight, number> = { blocking: 0, soon: 1, later: 2 };
  gaps.sort((a, b) => {
    const s = STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage);
    return s !== 0 ? s : WEIGHT[a.weight] - WEIGHT[b.weight];
  });

  // The next thing is the blocking gap on the step they are actually on, not
  // the earliest one in the chain. A team with seven features and no stories was
  // being told to go and name their product, which is true, trivial, and not
  // what is stopping them. Leftovers from earlier steps are still on the list.
  const next =
    gaps.find((g) => g.stage === stage && g.weight === "blocking") ??
    gaps.find((g) => g.weight === "blocking") ??
    gaps[0] ??
    null;

  return {
    productName: brief.productName,
    teamName: brief.teamName,
    stage,
    next,
    gaps,
    done,
    counts: {
      features: brief.features.length,
      stories: stories.length,
      cards: cardCount,
      screens: screens.length,
      components,
    },
  };
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

/** Where each stage's work actually gets done. */
const STAGE_LINK: Record<Stage, { label: string; href: string }> = {
  plan: { label: "your product plan", href: "" },
  stories: { label: "the story studio", href: "/trail-crew/write" },
  cards: { label: "your build cards", href: "cards.html" },
  architecture: { label: "your architecture page", href: "architecture.html" },
  build: { label: "the Figma guide", href: "/build/prototype-steps.html" },
};

const WEIGHT_HEADING: Record<Weight, string> = {
  blocking: "In the way right now",
  soon: "Will bite you during this step",
  later: "Real, and it can wait",
};

const WEIGHT_INTRO: Record<Weight, string> = {
  blocking:
    "Each of these stops the next step from honestly being done. Not because a rule says so: because the step after it reads the thing that is missing.",
  soon: "You can start without these. You will come back to them, and it is cheaper to do them now.",
  later: "Worth knowing about. Do not start here.",
};

/**
 * The chain drawn as a row, with the team's position marked.
 *
 * A student who is lost is usually lost about *order*, and a picture of the
 * order with an arrow on it answers that faster than any paragraph.
 */
function stageStrip(stage: Stage): string[] {
  const out: string[] = ["| " + STAGES.map((s) => STAGE_LABEL[s]).join(" | ") + " |"];
  out.push("|" + STAGES.map(() => "---").join("|") + "|");
  out.push(
    "| " +
      STAGES.map((s) => {
        const i = STAGES.indexOf(s);
        const here = STAGES.indexOf(stage);
        if (i < here) return "done";
        if (i === here) return "**you are here**";
        return "not yet";
      }).join(" | ") +
      " |",
  );
  return out;
}

export function renderGapGuide(report: GapReport): string {
  const out: string[] = [];
  const { stage, next, gaps, done } = report;

  out.push(`# What ${report.productName} still needs`);
  out.push("");
  out.push(
    "Nobody wrote this page. It was worked out by comparing your own documents against each other, and it gets shorter as you work. If something on it is wrong, the fix is in your documents rather than here.",
  );
  out.push("");

  // --- Where you are --------------------------------------------------------
  out.push("## Where you are");
  out.push("");
  out.push(...stageStrip(stage));
  out.push("");
  out.push(
    "Each step reads the one before it. That is why the order matters and why skipping one does not save time: it moves the work to a place where it is harder to do.",
  );
  out.push("");

  // --- The next thing -------------------------------------------------------
  out.push("## The next thing to do");
  out.push("");
  if (!next) {
    out.push(
      "**Nothing is missing that this page can see.** Every check it knows how to make, your documents pass.",
    );
    out.push("");
    out.push(
      "That is not the same as finished. This page can only compare your documents against each other. It cannot tell whether your app is any good, whether the thing you built is the thing you meant, or whether anybody who is not you can use it. Those need a person: your teacher, your team, and somebody who has never seen your app trying to use it in front of you.",
    );
    out.push("");
    const to = STAGE_LINK[stage];
    out.push(`So go and build. ${to.href ? `Start at [${to.label}](${to.href}).` : `Start at ${to.label}.`}`);
    out.push("");
  } else {
    out.push(`**${next.title}**`);
    out.push("");
    if (next.why) {
      out.push(next.why);
      out.push("");
    }
    if (next.fix) {
      out.push(`**Do this:** ${next.fix}`);
      out.push("");
    }
    const to = STAGE_LINK[next.stage];
    if (to.href) out.push(`It happens in [${to.label}](${to.href}).`);
    else out.push(`It happens in ${to.label}.`);
    out.push("");
    if (STAGES.indexOf(next.stage) < STAGES.indexOf(stage)) {
      out.push(
        `**This is left over from an earlier step.** You are on ${STAGE_LABEL[stage]} now, which is good, and this is still the thing most in the way. Skipped work does not stop being work.`,
      );
      out.push("");
    }
    const others = gaps.length - 1;
    if (others > 0) {
      out.push(
        others === 1
          ? "There is one other thing on this page. **Leave it for now.** It may well disappear when this one is fixed."
          : `There are ${others} other things on this page. **Do not read them yet.** Doing one thing properly beats starting six, and some of the others will disappear when this one is fixed.`,
      );
      out.push("");
    }
  }

  // --- Everything, grouped --------------------------------------------------
  if (gaps.length > 0) {
    out.push("## Everything, in the order it has to happen");
    out.push("");

    for (const weight of ["blocking", "soon", "later"] as Weight[]) {
      const group = gaps.filter((g) => g.weight === weight);
      if (group.length === 0) continue;
      out.push(`### ${WEIGHT_HEADING[weight]}`);
      out.push("");
      out.push(WEIGHT_INTRO[weight]);
      out.push("");
      for (const gap of group) {
        out.push(`#### ${gap.title}`);
        out.push("");
        out.push(
          `*${STAGE_LABEL[gap.stage]}${gap.where && gap.where !== STAGE_LABEL[gap.stage] ? `, ${gap.where}` : ""}.*`,
        );
        out.push("");
        if (gap.why) {
          out.push(gap.why);
          out.push("");
        }
        if (gap.fix) {
          out.push(`**Do this:** ${gap.fix}`);
          out.push("");
        }
      }
    }
  }

  // --- What you have already ------------------------------------------------
  if (done.length > 0) {
    out.push("## What you have already done");
    out.push("");
    out.push(
      "This is here because a list of what is missing, read on its own, is a lie about how much work you have done.",
    );
    out.push("");
    for (const item of done) out.push(`- ${item}`);
    out.push("");
  }

  // --- How to read it -------------------------------------------------------
  out.push("## How this page was worked out");
  out.push("");
  out.push(
    "Every line above came from comparing two of your own documents and finding they disagree, or finding one of them empty where the next one expects something. There is no opinion in it and no marking.",
  );
  out.push("");
  out.push(
    "So it can be wrong in one direction: **it only checks what it knows how to check.** A story can be well formed, testable, carded, architected, and still describe something nobody wants. This page will never tell you that. Your teacher and the person you hand your prototype to will.",
  );
  out.push("");
  out.push(
    "And ask below. The helper has your plan, your stories, your cards, your architecture and this list of gaps, so it can answer about *your* project rather than about projects in general.",
  );
  out.push("");

  return out.join("\n");
}

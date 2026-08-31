/**
 * The shapes that carry a student team's work from what they wrote to what
 * they can click.
 *
 * Three stages, and the separation between them is the point:
 *
 * 1. `ProductBrief` and `UserStory` are the students' own words, parsed out of
 *    the markdown they wrote. Nothing is invented here.
 * 2. `AppSpec` is the prototype plan, derived from stage 1 by rules a student
 *    can follow on paper. Every screen carries a `source` naming the sentence
 *    it came from, so a team can always ask "why is this screen here" and get
 *    an answer that points back at their own writing.
 * 3. HTML is the render of stage 2.
 *
 * Pure types only. No file system, no network, no framework. The engine has to
 * stay portable, because the classroom application that will wrap it lives in
 * a different codebase.
 */

// ---------------------------------------------------------------------------
// Stage 1: what the students wrote
// ---------------------------------------------------------------------------

export interface UserType {
  name: string;
  description?: string;
}

export interface Feature {
  name: string;
  description?: string;
}

/** The product plan or brief: purpose, users, description, features. */
export interface ProductBrief {
  productName: string;
  /**
   * True when the plan never named the product and the caller's fallback (the
   * team's folder name) was used instead.
   *
   * Worth tracking rather than silently papering over: a team that left the app
   * name blank gets a prototype titled after a folder slug, which looks like a
   * bug in the tool when it is really a blank in the plan.
   */
  productNameIsFallback?: boolean;
  teamName?: string;
  purpose: string;
  description: string;
  users: UserType[];
  features: Feature[];
}

/**
 * One acceptance scenario. Students are taught Given/When/Then, and most of
 * them will write something close to it and some of them will write a plain
 * sentence. Both are kept: `raw` always holds what they actually wrote.
 */
export interface Scenario {
  given?: string;
  when?: string;
  then?: string;
  raw: string;
}

export interface UserStory {
  /** Stable id in document order: S1, S2, and so on. */
  id: string;
  /** The "as a" clause. Empty when the student did not write one. */
  role: string;
  /** The "I want" clause, or the whole line when the form was not followed. */
  want: string;
  /** The "so that" clause. Absent is a teachable gap, not an error. */
  soThat?: string;
  scenarios: Scenario[];
  /** The heading this story sat under, when there was one. */
  featureHint?: string;
  raw: string;
}

// ---------------------------------------------------------------------------
// Stage 2: the prototype plan
// ---------------------------------------------------------------------------

/**
 * One thing on a screen. Deliberately small: the renderer owns all markup, so
 * a prototype cannot come out broken no matter what a student typed.
 */
export type ElementSpec =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "list"; heading?: string; items: string[] }
  | { kind: "card"; title: string; body?: string; to?: string; meta?: string }
  /**
   * `to` navigates to another screen. `says` flashes a line in place, which is
   * how an unfinished story announces itself: the button works, and what it
   * says is the team's own Then clause, or a note that they never wrote one.
   */
  | { kind: "button"; label: string; to?: string; says?: string; primary?: boolean }
  | {
      kind: "field";
      label: string;
      control: "text" | "textarea" | "select" | "date" | "toggle";
      options?: string[];
    }
  | { kind: "stat"; label: string; value: string }
  | { kind: "note"; text: string };

/** Where a screen came from, so the prototype can explain itself. */
export interface ScreenSource {
  kind: "core" | "feature" | "story";
  /** Story id or feature name, when there is one. */
  ref?: string;
  /** Human readable, shown in the coach panel. */
  label: string;
}

export interface ScreenSpec {
  id: string;
  title: string;
  subtitle?: string;
  /** User type names that see this screen. Empty means everyone. */
  roles: string[];
  inNav: boolean;
  elements: ElementSpec[];
  source: ScreenSource;
}

export interface PrototypeTheme {
  primary: string;
  accent: string;
  surface: string;
  text: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
}

/**
 * A note from the prototype back to the team.
 *
 * `gap` is the teaching payload: the generator is deterministic, so a thin
 * brief produces a thin prototype, and the note says exactly which sentence
 * was missing. That is the lesson the whole exercise exists to deliver.
 */
export interface CoachNote {
  level: "gap" | "tip" | "win";
  message: string;
  /** What the note is about: a feature name, a story id, a section. */
  where?: string;
}

export interface AppSpec {
  productName: string;
  teamName?: string;
  tagline: string;
  /** The user types the plan named. Shown on the "who this is for" screen. */
  roles: UserType[];
  /**
   * What the "view as" switcher offers: the plan's user types plus any role a
   * story was written for that the plan never named.
   *
   * They are separate lists because teams routinely name one set of people in
   * the plan and write stories about another. Offering only the plan's list
   * gives a switcher that empties the app, which reads as broken rather than as
   * the finding it is. The coach notes say the two lists disagree; the switcher
   * still has to work.
   */
  viewAs: string[];
  screens: ScreenSpec[];
  theme: PrototypeTheme;
  notes: CoachNote[];
  /** Counts shown on the "how this was made" screen. */
  stats: {
    features: number;
    stories: number;
    scenarios: number;
    screens: number;
  };
}

import { AGE_GROUPS, SIZES, type AgeGroup, type Level, type Size } from "./types";

/**
 * The adopter match quiz. Answers are stored as JSON keyed by these ids, so
 * rewording a question never needs a migration. Keep it under three minutes.
 */

export type SpeciesPref = "dog" | "cat" | "either";
export type Home = "apartment" | "house_no_yard" | "house_yard";
export type HoursAway = "short" | "workday" | "long";
export type Kids = "none" | "under10" | "over10";

export interface Answers {
  species: SpeciesPref;
  home: Home;
  activity: Level;
  hoursAway: HoursAway;
  experience: Level;
  kids: Kids;
  hasDogs: boolean;
  hasCats: boolean;
  /** Empty means any size. Dogs only; cats vary too little to ask. */
  sizes: Size[];
  /** A lease or HOA limit. Applied as a dealbreaker. Dogs only. */
  maxSize: Size | null;
  /** Empty means any age. */
  ages: AgeGroup[];
  grooming: Level;
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface Question {
  id: keyof Answers;
  title: string;
  help?: string;
  kind: "single" | "multi" | "yesno";
  choices: Choice<string>[];
}

export const QUESTIONS: Question[] = [
  {
    id: "species",
    title: "Who are you looking for?",
    kind: "single",
    choices: [
      { value: "dog", label: "A dog" },
      { value: "cat", label: "A cat" },
      { value: "either", label: "Open to either" },
    ],
  },
  {
    id: "home",
    title: "Where do you live?",
    kind: "single",
    choices: [
      { value: "apartment", label: "Apartment or condo" },
      { value: "house_no_yard", label: "House, no fenced yard" },
      { value: "house_yard", label: "House with a fenced yard" },
    ],
  },
  {
    id: "activity",
    title: "How active is your household?",
    kind: "single",
    choices: [
      { value: "1", label: "Relaxed", hint: "Short walks, lots of couch time" },
      { value: "2", label: "Moderate", hint: "Daily walks, weekend outings" },
      { value: "3", label: "Very active", hint: "Runs, hikes, always on the go" },
    ],
  },
  {
    id: "hoursAway",
    title: "On a typical day, how long is no one home?",
    kind: "single",
    choices: [
      { value: "short", label: "Under 4 hours" },
      { value: "workday", label: "4 to 8 hours" },
      { value: "long", label: "More than 8 hours" },
    ],
  },
  {
    id: "experience",
    title: "How much pet experience do you have?",
    kind: "single",
    choices: [
      { value: "1", label: "This is my first pet" },
      { value: "2", label: "I have had pets before" },
      { value: "3", label: "Experienced with training and behavior" },
    ],
  },
  {
    id: "kids",
    title: "Are there kids in your home?",
    help: "Include kids who visit often.",
    kind: "single",
    choices: [
      { value: "none", label: "No kids" },
      { value: "under10", label: "Yes, under 10" },
      { value: "over10", label: "Yes, 10 and older" },
    ],
  },
  {
    id: "hasDogs",
    title: "Do you have a dog now?",
    kind: "yesno",
    choices: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "hasCats",
    title: "Do you have a cat now?",
    kind: "yesno",
    choices: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "sizes",
    title: "What size dog would you like?",
    help: "Pick any that work. Skip if you are open to all.",
    kind: "multi",
    choices: [
      { value: "small", label: "Small", hint: "Under 25 lb" },
      { value: "medium", label: "Medium", hint: "25 to 50 lb" },
      { value: "large", label: "Large", hint: "50 to 90 lb" },
      { value: "xlarge", label: "Extra large", hint: "Over 90 lb" },
    ],
  },
  {
    id: "maxSize",
    title: "Does your lease or HOA limit dog size?",
    kind: "single",
    choices: [
      { value: "none", label: "No limit" },
      { value: "small", label: "Small only" },
      { value: "medium", label: "Up to medium" },
      { value: "large", label: "Up to large" },
    ],
  },
  {
    id: "ages",
    title: "What age would you like?",
    help: "Pick any that work. Skip if you are open to all.",
    kind: "multi",
    choices: [
      { value: "baby", label: "Puppy or kitten" },
      { value: "young", label: "Young" },
      { value: "adult", label: "Adult" },
      { value: "senior", label: "Senior" },
    ],
  },
  {
    id: "grooming",
    title: "How much brushing and grooming are you up for?",
    kind: "single",
    choices: [
      { value: "1", label: "Minimal" },
      { value: "2", label: "Weekly brushing is fine" },
      { value: "3", label: "Happy to groom often" },
    ],
  },
];

export const DEFAULT_ANSWERS: Answers = {
  species: "either",
  home: "house_no_yard",
  activity: 2,
  hoursAway: "workday",
  experience: 2,
  kids: "none",
  hasDogs: false,
  hasCats: false,
  sizes: [],
  maxSize: null,
  ages: [],
  grooming: 2,
};

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function level(v: unknown, fallback: Level): Level {
  const n = Number(v);
  return n === 1 || n === 2 || n === 3 ? n : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === "yes" || v === "true";
}

function list<T extends string>(v: unknown, allowed: readonly T[]): T[] {
  const raw = Array.isArray(v) ? v : typeof v === "string" && v ? v.split(",") : [];
  return [...new Set(raw.filter((x): x is T => (allowed as readonly unknown[]).includes(x)))];
}

/**
 * Turns anything (a cookie, a form, a database row) into valid answers.
 * Unknown or missing values fall back to defaults instead of throwing, so an
 * old saved answer set still works after the quiz changes.
 */
export function parseAnswers(input: unknown): Answers {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_ANSWERS;
  const max = o.maxSize === "none" ? null : o.maxSize;
  return {
    species: pick(o.species, ["dog", "cat", "either"] as const, d.species),
    home: pick(o.home, ["apartment", "house_no_yard", "house_yard"] as const, d.home),
    activity: level(o.activity, d.activity),
    hoursAway: pick(o.hoursAway, ["short", "workday", "long"] as const, d.hoursAway),
    experience: level(o.experience, d.experience),
    kids: pick(o.kids, ["none", "under10", "over10"] as const, d.kids),
    hasDogs: bool(o.hasDogs),
    hasCats: bool(o.hasCats),
    sizes: list(o.sizes, SIZES),
    maxSize: typeof max === "string" && (SIZES as string[]).includes(max) ? (max as Size) : null,
    ages: list(o.ages, AGE_GROUPS),
    grooming: level(o.grooming, d.grooming),
  };
}

/** Reads a submitted quiz form. Multi-select fields arrive as repeated keys. */
export function answersFromForm(form: FormData): Answers {
  const obj: Record<string, unknown> = {};
  for (const q of QUESTIONS) {
    obj[q.id] = q.kind === "multi" ? form.getAll(q.id).map(String) : form.get(q.id);
  }
  return parseAnswers(obj);
}

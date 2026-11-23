/**
 * The sign up form: its options and the one validation both the browser and
 * the server use. Pure, so it is easy to test.
 */

export const GRADES = [6, 7, 8] as const;
export type Grade = (typeof GRADES)[number];

export const POSITIONS = [
  { id: "pitcher", label: "Pitcher", short: "P" },
  { id: "catcher", label: "Catcher", short: "C" },
  { id: "first", label: "First Base", short: "1B" },
  { id: "second", label: "Second Base", short: "2B" },
  { id: "short", label: "Shortstop", short: "SS" },
  { id: "third", label: "Third Base", short: "3B" },
  { id: "left", label: "Left Field", short: "LF" },
  { id: "center", label: "Center Field", short: "CF" },
  { id: "right", label: "Right Field", short: "RF" },
  { id: "not_sure", label: "Not sure yet. I'll try anything!", short: "Any" },
] as const;
export type PositionId = (typeof POSITIONS)[number]["id"];

/** Years played before this season. 6 means "6 or more". */
export const EXPERIENCE = [
  { value: 0, label: "This is my first year!", emoji: "🌱" },
  { value: 1, label: "1 year", emoji: "" },
  { value: 2, label: "2 years", emoji: "" },
  { value: 3, label: "3 years", emoji: "" },
  { value: 4, label: "4 years", emoji: "" },
  { value: 5, label: "5 years", emoji: "" },
  { value: 6, label: "6 or more", emoji: "🔥" },
] as const;
export const MAX_YEARS = 6;

export const PLAYED_WHERE = [
  { id: "little_league", label: "Little League" },
  { id: "rec", label: "Rec league" },
  { id: "travel", label: "Travel or club team" },
  { id: "school", label: "A school team" },
  { id: "softball", label: "Softball" },
  { id: "backyard", label: "Backyard, with family or friends" },
] as const;
export type PlayedWhereId = (typeof PLAYED_WHERE)[number]["id"];

export const LIMITS = { name: 50, teams: 200, notes: 1000 } as const;

/** What the browser sends. Everything is untrusted. */
export interface SignupInput {
  firstName?: unknown;
  lastName?: unknown;
  grade?: unknown;
  positions?: unknown;
  yearsPlayed?: unknown;
  playedWhere?: unknown;
  teamNames?: unknown;
  notes?: unknown;
}

export interface Signup {
  firstName: string;
  lastName: string;
  grade: Grade;
  positions: PositionId[];
  yearsPlayed: number;
  playedWhere: PlayedWhereId[];
  teamNames: string | null;
  notes: string | null;
}

export type FieldErrors = Partial<Record<keyof Signup, string>>;

export type ValidationResult = { ok: true; data: Signup } | { ok: false; errors: FieldErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function longText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const set = new Set(allowed as readonly string[]);
  // Keep the order of `allowed`, drop unknowns and duplicates.
  return allowed.filter((id) => value.includes(id) && set.has(id));
}

export function validateSignup(input: SignupInput): ValidationResult {
  const errors: FieldErrors = {};

  const firstName = text(input.firstName);
  const lastName = text(input.lastName);
  if (!firstName) errors.firstName = "What's your first name?";
  else if (firstName.length > LIMITS.name) errors.firstName = "That name is a little long.";
  if (!lastName) errors.lastName = "What's your last name?";
  else if (lastName.length > LIMITS.name) errors.lastName = "That name is a little long.";

  const grade = Number(input.grade);
  if (!GRADES.includes(grade as Grade)) errors.grade = "Pick your grade.";

  const positions = pick(
    input.positions,
    POSITIONS.map((p) => p.id),
  );
  if (positions.length === 0) errors.positions = "Pick at least one. \"Not sure yet\" counts!";

  const years = Number(input.yearsPlayed);
  const yearsOk =
    input.yearsPlayed !== "" && input.yearsPlayed != null && Number.isInteger(years) && years >= 0 && years <= MAX_YEARS;
  if (!yearsOk) errors.yearsPlayed = "Pick one. First year is a great answer!";

  const playedWhere = pick(
    input.playedWhere,
    PLAYED_WHERE.map((p) => p.id),
  );

  const teamNames = text(input.teamNames);
  if (teamNames.length > LIMITS.teams) errors.teamNames = `Keep it under ${LIMITS.teams} characters.`;

  const notes = longText(input.notes);
  if (notes.length > LIMITS.notes) errors.notes = `Keep it under ${LIMITS.notes} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      grade: grade as Grade,
      positions,
      yearsPlayed: years,
      playedWhere,
      teamNames: teamNames || null,
      notes: notes || null,
    },
  };
}

export function positionLabel(id: string): string {
  return POSITIONS.find((p) => p.id === id)?.label ?? id;
}

export function positionShort(id: string): string {
  return POSITIONS.find((p) => p.id === id)?.short ?? id;
}

export function playedWhereLabel(id: string): string {
  return PLAYED_WHERE.find((p) => p.id === id)?.label ?? id;
}

export function yearsLabel(years: number): string {
  if (years <= 0) return "First year";
  if (years >= MAX_YEARS) return `${MAX_YEARS}+ years`;
  return years === 1 ? "1 year" : `${years} years`;
}

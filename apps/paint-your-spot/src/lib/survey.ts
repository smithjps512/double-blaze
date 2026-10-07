/**
 * The interest survey: options, labels, and validation.
 *
 * Pure on purpose, so the same rules run in tests, in the server action, and
 * in the admin dashboard. The database checks repeat these values; change
 * both together.
 */

export const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Administration" },
  { value: "other", label: "Other" },
] as const;

export const INTEREST_LEVELS = [
  { value: "in", label: "I'm in", hint: "Hand me a brush." },
  { value: "probably", label: "Probably", hint: "Leaning yes, need details." },
  { value: "curious", label: "Just curious", hint: "Window shopping for now." },
] as const;

export const INTERESTS = [
  { value: "standard", label: "A Standard Lot" },
  { value: "prime", label: "Prime Real Estate (near the doors)" },
  { value: "boss", label: "Chipping into Paint the Boss" },
] as const;

export const LOTS = [
  { value: "front", label: "Front lot" },
  { value: "back", label: "Back lot" },
  { value: "either", label: "No preference" },
] as const;

export const PAINTERS = [
  { value: "self", label: "I'll paint it myself" },
  { value: "art_student", label: "I'd like an art student to paint it" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export const KEEP_YEARLY = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
] as const;

export const PRICE_COMFORT = [
  { value: "up_to_25", label: "Up to $25" },
  { value: "up_to_40", label: "Up to $40" },
  { value: "up_to_60", label: "Up to $60" },
  { value: "more_for_prime", label: "More, for a prime spot" },
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];

export type Role = Values<typeof ROLES>;
export type InterestLevel = Values<typeof INTEREST_LEVELS>;
export type Interest = Values<typeof INTERESTS>;
export type Lot = Values<typeof LOTS>;
export type Painter = Values<typeof PAINTERS>;
export type KeepYearly = Values<typeof KEEP_YEARLY>;
export type PriceComfort = Values<typeof PRICE_COMFORT>;

export interface SurveyAnswers {
  name: string;
  role: Role;
  interest_level: InterestLevel;
  interests: Interest[];
  preferred_lot: Lot;
  painter: Painter;
  keep_yearly: KeepYearly;
  price_comfort: PriceComfort;
  comments: string | null;
}

export interface ResponseRow extends SurveyAnswers {
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export const NAME_MAX = 120;
export const COMMENTS_MAX = 2000;

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function pick<T extends readonly { value: string }[]>(
  options: T,
  raw: unknown,
): Values<T> | null {
  return typeof raw === "string" && options.some((o) => o.value === raw)
    ? (raw as Values<T>)
    : null;
}

export type ValidationResult =
  | { ok: true; answers: SurveyAnswers }
  | { ok: false; errors: Partial<Record<keyof SurveyAnswers, string>> };

/**
 * Checks raw form input. `isBoss` drops the Paint the Boss option silently:
 * the boss never sees it, so there is nothing to explain.
 */
export function validateSurvey(
  input: Record<string, unknown>,
  { isBoss }: { isBoss: boolean },
): ValidationResult {
  const errors: Partial<Record<keyof SurveyAnswers, string>> = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.name = "We need a name for the deed.";
  else if (name.length > NAME_MAX) errors.name = "That name is longer than the lot.";

  const role = pick(ROLES, input.role);
  if (!role) errors.role = "Pick a role.";

  const interest_level = pick(INTEREST_LEVELS, input.interest_level);
  if (!interest_level) errors.interest_level = "Pick how interested you are.";

  const rawInterests = Array.isArray(input.interests) ? input.interests : [];
  const interests = Array.from(
    new Set(
      rawInterests
        .map((v) => pick(INTERESTS, v))
        .filter((v): v is Interest => v !== null)
        .filter((v) => !(isBoss && v === "boss")),
    ),
  );

  const preferred_lot = pick(LOTS, input.preferred_lot);
  if (!preferred_lot) errors.preferred_lot = "Pick a lot, or no preference.";

  const painter = pick(PAINTERS, input.painter);
  if (!painter) errors.painter = "Tell us who holds the brush.";

  const keep_yearly = pick(KEEP_YEARLY, input.keep_yearly);
  if (!keep_yearly) errors.keep_yearly = "Pick one.";

  const price_comfort = pick(PRICE_COMFORT, input.price_comfort);
  if (!price_comfort) errors.price_comfort = "Pick a price range.";

  const rawComments = typeof input.comments === "string" ? input.comments.trim() : "";
  if (rawComments.length > COMMENTS_MAX) {
    errors.comments = `Keep it under ${COMMENTS_MAX} characters.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    answers: {
      name,
      role: role!,
      interest_level: interest_level!,
      interests,
      preferred_lot: preferred_lot!,
      painter: painter!,
      keep_yearly: keep_yearly!,
      price_comfort: price_comfort!,
      comments: rawComments || null,
    },
  };
}

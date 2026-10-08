/**
 * Values James can change from /admin without a redeploy. Every one starts as
 * a placeholder because the decisions are still open.
 */

export const SETTING_KEYS = [
  "standard_fee",
  "prime_fee",
  "boss_pot_goal",
  "interest_goal",
  "interest_deadline",
  "payment_link",
  "money_destination",
  "term_text",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type Settings = Record<SettingKey, string>;

export const SETTING_FIELDS: {
  key: SettingKey;
  label: string;
  hint: string;
  kind: "money" | "number" | "date" | "url" | "text";
}[] = [
  { key: "standard_fee", label: "Spot price", hint: "Dollars. One price for every spot. Saved for the sale.", kind: "money" },
  { key: "interest_goal", label: "Interest goal", hint: "I'm in plus Probably. Shown on the meter.", kind: "number" },
  { key: "interest_deadline", label: "Interest deadline", hint: "Last day to raise a hand, Eastern time.", kind: "date" },
  { key: "payment_link", label: "Payment link", hint: "Not shown in Phase 1. Saved for Phase 2.", kind: "url" },
  { key: "money_destination", label: "Where the money goes", hint: "Shown on the landing page.", kind: "text" },
  { key: "term_text", label: "Annual or one-time", hint: "For example: Your spot is yours for the school year.", kind: "text" },
];

export function defaultSettings(env: Record<string, string | undefined> = {}): Settings {
  return {
    standard_fee: "",
    prime_fee: "",
    boss_pot_goal: "100",
    interest_goal: env.INTEREST_GOAL || String(DEFAULT_GOAL),
    interest_deadline: "2026-10-16",
    payment_link: "",
    money_destination: "Staff events, meals, and celebrations",
    term_text: "",
  };
}

export function mergeSettings(
  base: Settings,
  rows: { key: string; value: string | null }[] | null | undefined,
): Settings {
  const out = { ...base };
  for (const row of rows ?? []) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key) && row.value != null && row.value !== "") {
      out[row.key as SettingKey] = row.value;
    }
  }
  return out;
}

/** "$40" from "40", "40.00", or "$40". Null when unset or nonsense. */
export function formatMoney(raw: string): string | null {
  const n = Number(raw.replace(/[$,\s]/g, ""));
  if (!raw.trim() || !Number.isFinite(n) || n < 0) return null;
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export const DEFAULT_GOAL = 25;

export function toGoal(raw: string, fallback = DEFAULT_GOAL): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type SettingsValidation =
  | { ok: true; values: Settings }
  | { ok: false; errors: Partial<Record<SettingKey, string>> };

export function validateSettings(input: Record<string, unknown>): SettingsValidation {
  const errors: Partial<Record<SettingKey, string>> = {};
  const values = {} as Settings;
  for (const field of SETTING_FIELDS) {
    const raw = typeof input[field.key] === "string" ? (input[field.key] as string).trim() : "";
    values[field.key] = raw;
    if (!raw) continue;
    if (field.kind === "money" && formatMoney(raw) === null) errors[field.key] = "Use a dollar amount like 40.";
    if (field.kind === "number" && !(Number.parseInt(raw, 10) > 0)) errors[field.key] = "Use a whole number above 0.";
    if (field.kind === "date" && !parseDate(raw)) errors[field.key] = "Use a date like 2026-10-16.";
    if (field.kind === "url" && !/^https:\/\/\S+$/.test(raw)) errors[field.key] = "Use a full https:// link.";
    if (raw.length > 300) errors[field.key] = "Keep it under 300 characters.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

/** A real calendar date in YYYY-MM-DD form, as UTC midnight. Null otherwise. */
export function parseDate(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
}

export interface Deadline {
  /** "Friday, October 16" */
  label: string;
  /** Calendar days left in Eastern time. 0 is the last day, negative is past. */
  daysLeft: number;
  closed: boolean;
}

/** Today's date in Eastern time, where BMS is. */
export function easternToday(now: Date): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  return parseDate(ymd)!;
}

export function deadlineInfo(raw: string, now: Date = new Date()): Deadline | null {
  const date = parseDate(raw);
  if (!date) return null;
  const daysLeft = Math.round((date.getTime() - easternToday(now).getTime()) / 86_400_000);
  return {
    label: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }),
    daysLeft,
    closed: daysLeft < 0,
  };
}

/** "3 days left", "Last day!", or "Closed". */
export function daysLeftText(d: Deadline): string {
  if (d.closed) return "Closed";
  if (d.daysLeft === 0) return "Last day!";
  return d.daysLeft === 1 ? "1 day left" : `${d.daysLeft} days left`;
}

import { PRACTICE_AREAS } from "./practice";

/**
 * "Tell us about your needs" intake: the options the form offers, validation,
 * and routing to practice groups. Pure (no I/O) so it is unit-testable; the API
 * route passes in process.env and the central inbox.
 */

export const ORG_TYPES = [
  { value: "smb", label: "Small or midsize business" },
  { value: "enterprise", label: "Large enterprise" },
  { value: "local-gov", label: "Local government" },
  { value: "state-gov", label: "State agency or department" },
  { value: "federal-gov", label: "Federal agency or department" },
  { value: "gov-contractor", label: "Government contractor" },
  { value: "institution", label: "Nonprofit, school, or institution" },
] as const;

/** Org types that see the solicitation / contract field. */
export const GOVERNMENT_ORG_TYPES = new Set<string>([
  "local-gov",
  "state-gov",
  "federal-gov",
  "gov-contractor",
]);

export const NEED_TYPES = [
  { value: "new", label: "Start something new" },
  { value: "fix", label: "Fix or improve how something works today" },
  { value: "extend", label: "Add to something we already have" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const TIMELINES = [
  { value: "now", label: "As soon as possible" },
  { value: "1-3", label: "In the next 1 to 3 months" },
  { value: "3-6", label: "In 3 to 6 months" },
  { value: "6+", label: "6 months or more" },
  { value: "exploring", label: "Just exploring" },
] as const;

export const NOT_SURE_PRACTICE = "not-sure";

export interface IntakeInput {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  orgType: string;
  practices: string[];
  needType: string;
  timeline: string;
  solicitation: string;
  message: string;
}

const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((o) => o.value === v)?.label ?? "";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Normalizes a raw JSON body. Unknown option values are dropped, not echoed. */
export function parseIntake(raw: Record<string, unknown>): IntakeInput {
  const known = new Set([...PRACTICE_AREAS.map((p) => p.slug), NOT_SURE_PRACTICE]);
  const practicesRaw = Array.isArray(raw.practices)
    ? raw.practices
    : typeof raw.practices === "string"
      ? [raw.practices]
      : [];
  const practices = [
    ...new Set(practicesRaw.filter((p): p is string => typeof p === "string" && known.has(p))),
  ];
  const orgType = str(raw.orgType);
  return {
    name: str(raw.name),
    email: str(raw.email),
    phone: str(raw.phone, 40),
    organization: str(raw.organization),
    role: str(raw.role),
    orgType: label(ORG_TYPES, orgType) ? orgType : "",
    practices,
    needType: label(NEED_TYPES, str(raw.needType)) ? str(raw.needType) : "",
    timeline: label(TIMELINES, str(raw.timeline)) ? str(raw.timeline) : "",
    solicitation: GOVERNMENT_ORG_TYPES.has(orgType) ? str(raw.solicitation) : "",
    message: str(raw.message, 5000),
  };
}

/** Returns a client-safe error, or null when the intake is complete. */
export function validateIntake(input: IntakeInput): string | null {
  if (!input.name || !input.email || !input.organization || !input.message) {
    return "Please add your name, email, organization, and a few words about your needs.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Please enter a valid email address.";
  }
  if (!input.orgType) return "Please tell us what kind of organization you are.";
  return null;
}

/**
 * Where an intake goes: each selected practice group's inbox (from its env
 * var), deduplicated. Practices without an inbox, "not sure", or no selection
 * all fall back to the central inbox, so nothing is dropped. The central inbox
 * is always included so someone sees every request.
 */
export function routeIntake(
  practices: string[],
  env: Record<string, string | undefined>,
  centralInbox: string,
): string[] {
  const to = new Set<string>();
  for (const slug of practices) {
    const area = PRACTICE_AREAS.find((p) => p.slug === slug);
    const inbox = area ? env[area.inboxEnv]?.trim() : "";
    if (inbox) to.add(inbox.toLowerCase());
  }
  to.add(centralInbox.toLowerCase());
  return [...to];
}

export function practiceTitles(practices: string[]): string[] {
  return practices.map((slug) =>
    slug === NOT_SURE_PRACTICE
      ? "Not sure, help me choose"
      : PRACTICE_AREAS.find((p) => p.slug === slug)?.title ?? slug,
  );
}

export function describeIntake(input: IntakeInput) {
  return {
    orgType: label(ORG_TYPES, input.orgType),
    needType: label(NEED_TYPES, input.needType),
    timeline: label(TIMELINES, input.timeline),
    practices: practiceTitles(input.practices),
  };
}

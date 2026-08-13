/**
 * Member profiles (session 4).
 *
 * The brief puts the profile first: "Once a member, the first prompt is to
 * create a profile", because it is the beginning of members engaging with each
 * other and it is what an article is published under.
 *
 * Stored in `site_members.profile`, a jsonb map rather than columns. 0013 chose
 * that so per-field visibility ("show my employer, hide my phone") is a change
 * to one column rather than a migration. This module is what gives that map a
 * shape.
 *
 * Employer and title are prefilled from the join answers, so a new member's
 * first sight of the form is half filled in rather than blank. That is the
 * cheapest thing available to make the first prompt feel small, and the first
 * quality measure in the brief is that members actually take part.
 *
 * Pure and framework-free. No em dashes, per the house rule.
 */

export interface ProfileField {
  key: string;
  label: string;
  help?: string;
  kind: "text" | "textarea";
  maxLength: number;
  rows?: number;
  autoComplete?: string;
}

/**
 * Everything asked for, in order, and all of it optional.
 *
 * Nothing here is required, deliberately. A member is already admitted by the
 * time they see this, so a required field would be a barrier placed after the
 * decision rather than before it. The prompt exists to invite a profile, not to
 * withhold the site until one exists.
 */
export const PROFILE_FIELDS: readonly ProfileField[] = [
  {
    key: "employer",
    label: "Employer",
    kind: "text",
    maxLength: 120,
    autoComplete: "organization",
  },
  {
    key: "title",
    label: "Role or title",
    kind: "text",
    maxLength: 120,
    autoComplete: "organization-title",
  },
  {
    key: "location",
    label: "Where you are based",
    help: "City and country is plenty. The membership is international.",
    kind: "text",
    maxLength: 120,
  },
  {
    key: "career",
    label: "What you work on",
    help: "A few lines on your work and your background. This is what other members read first.",
    kind: "textarea",
    maxLength: 1500,
    rows: 6,
  },
  {
    key: "interests",
    label: "What you want to learn or discuss",
    help: "The subjects you would happily be asked about, and the ones you want answers on.",
    kind: "textarea",
    maxLength: 800,
    rows: 4,
  },
  {
    key: "links",
    label: "Anything else you want to share",
    help: "A public profile, published work, a personal site. One per line.",
    kind: "textarea",
    maxLength: 500,
    rows: 3,
  },
];

/** The photo is not a text field, so it is not in PROFILE_FIELDS. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface Profile {
  /** Storage path in the member-media bucket. Never a URL: reads are proxied. */
  photo_path?: string;
  [key: string]: string | undefined;
}

/** How much of a profile exists, for deciding whether to nudge. */
export interface ProfileCompleteness {
  filled: number;
  total: number;
  /** Whether it is complete enough to stop prompting. */
  enough: boolean;
}

/**
 * Whether to keep asking.
 *
 * "Enough" is a photo or a career description, not every field. The prompt is a
 * nudge toward taking part, and a nudge that will not go away until every box
 * is filled stops being a nudge.
 */
export function profileCompleteness(profile: Profile | null | undefined): ProfileCompleteness {
  const p = profile && typeof profile === "object" ? profile : {};
  const keys = [...PROFILE_FIELDS.map((f) => f.key), "photo_path"];
  const filled = keys.filter((k) => typeof p[k] === "string" && (p[k] as string).length > 0).length;
  return {
    filled,
    total: keys.length,
    enough: Boolean(p.career || p.photo_path),
  };
}

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanBlock(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return (
    value
      .replace(/\r\n?/g, "\n")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ")
      .replace(/[ \t]+/g, " ")
      .split("\n")
      .map((l) => l.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max)
  );
}

/**
 * Clean a submitted profile into what gets stored.
 *
 * Truncates rather than refuses. Nothing here is required and nothing is
 * load bearing, so rejecting a whole form because one field ran long would cost
 * the member more than the extra characters are worth. The questionnaire in
 * lib/join.ts refuses instead, because those answers feed a decision.
 *
 * Unknown keys are dropped, so a caller cannot use this to write arbitrary
 * jsonb, and photo_path is deliberately not settable here: it is written only by
 * the upload route, which knows where it actually put the bytes.
 */
export function cleanProfile(input: unknown, existing?: Profile | null): Profile {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Profile = {};

  for (const field of PROFILE_FIELDS) {
    const value =
      field.kind === "textarea"
        ? cleanBlock(body[field.key], field.maxLength)
        : cleanLine(body[field.key], field.maxLength);
    if (value) out[field.key] = value;
  }

  const photo = existing?.photo_path;
  if (typeof photo === "string" && photo) out.photo_path = photo;

  return out;
}

/**
 * A starting profile, built from what they already told us at the door.
 *
 * Only for a member who has no profile yet. Overwriting a profile somebody has
 * edited with the answers they gave months ago would be worse than an empty
 * form.
 */
export function prefillFromJoinAnswers(joinAnswers: Record<string, unknown> | null | undefined): Profile {
  const answers = joinAnswers && typeof joinAnswers === "object" ? joinAnswers : {};
  const out: Profile = {};
  if (typeof answers.employer === "string" && answers.employer) out.employer = answers.employer;
  if (typeof answers.role_title === "string" && answers.role_title) out.title = answers.role_title;
  if (typeof answers.interest === "string" && answers.interest) out.interests = answers.interest;
  return out;
}

/** The one-line summary under a name, in the directory and on an article. */
export function profileHeadline(profile: Profile | null | undefined): string {
  const p = profile && typeof profile === "object" ? profile : {};
  const parts = [p.title, p.employer].filter((s): s is string => Boolean(s));
  return parts.join(", ");
}

/**
 * Split the free-text links field into lines worth rendering as links.
 *
 * Anything that is not an http or https URL stays as plain text rather than
 * being coerced into one. A member typing "ask me on LinkedIn" should see that
 * sentence, not a broken link.
 */
export function profileLinks(value: string | undefined): { text: string; href: string | null }[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((text) => ({
      text,
      href: /^https?:\/\/[^\s]+$/i.test(text) ? text : null,
    }));
}

/** Whether an uploaded file is an acceptable photo. */
export function checkPhoto(file: { type: string; size: number }): string | null {
  if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Photos need to be a JPEG, PNG, or WebP.";
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return `That photo is larger than ${Math.round(PHOTO_MAX_BYTES / 1024 / 1024)}MB.`;
  }
  if (file.size === 0) return "That file was empty.";
  return null;
}

/** Where a member's upload goes. The path is the security model; see 0022. */
export function mediaPath(siteId: string, memberId: string, extension: string): string {
  const safe = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  return `${siteId}/${memberId}/${crypto.randomUUID()}.${safe}`;
}

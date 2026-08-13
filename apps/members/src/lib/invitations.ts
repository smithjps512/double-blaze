/**
 * Invitations (session 3e).
 *
 * The other half of the brief's join requirement: "if invited, the member can
 * join without any further approval". An invited person skips the
 * questionnaire and the queue entirely, because an administrator has already
 * made the decision the queue exists to capture.
 *
 * Pure and framework-free, like lib/join.ts and lib/admin.ts. Token generation
 * lives in lib/tokens.ts so this module stays importable by the browser.
 *
 * ---------------------------------------------------------------------------
 * The guest tier, and how much of it this file actually decides
 * ---------------------------------------------------------------------------
 *
 * Open item 7 in the build plan asks who invites a guest, how long access
 * lasts, what expires when it does, and what they can still see afterward.
 * Three of those four were already answered, and it is worth writing down
 * where, so they are not reopened as though they were still live:
 *
 *  - **Who invites.** The brief gives administrators "manage guest access", so
 *    guests are invited by an administrator. Not a client question.
 *  - **What expires.** `app.is_active_site_member` in migration 0013 already
 *    treats a lapsed window as not being a member, and every policy keyed on it
 *    inherits that. So a guest whose window closes loses everything at once.
 *    That is the strictest reading and the safe default to be wrong in.
 *  - **What they keep.** Their articles. A guest is invited precisely so the
 *    membership can read what they wrote, and withdrawing it when their access
 *    lapses would defeat the reason for inviting them. Authorship is a
 *    reference to their row, which continues to exist.
 *
 * What is genuinely still open is **how long**, and that is a default rather
 * than a blocker: an administrator picks the window per invitation, so the club
 * can answer it by using the thing. The default below is a starting position,
 * not a decision taken on the club's behalf.
 *
 * Two questions remain for the club, and neither one blocks this session. They
 * are recorded in status.md: whether a guest sees the member directory, which
 * is session 4, and whether a lapsed guest keeps read access to the library,
 * which is session 5.
 *
 * No em dashes anywhere, per the house rule.
 */

/** Roles an administrator may invite somebody into. */
export const INVITABLE_ROLES = ["member", "guest", "officer", "admin"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export interface InvitableRoleOption {
  value: InvitableRole;
  label: string;
  help: string;
  /** Whether this role needs an access window. */
  bounded: boolean;
}

export const INVITABLE_ROLE_OPTIONS: readonly InvitableRoleOption[] = [
  {
    value: "member",
    label: "Member",
    help: "Full access, no end date. What almost every invitation should be.",
    bounded: false,
  },
  {
    value: "guest",
    label: "Guest",
    help: "A speaker or an author, for a fixed period. Their articles stay published after it ends.",
    bounded: true,
  },
  {
    value: "officer",
    label: "Officer",
    help: "A member who can also moderate what is posted.",
    bounded: false,
  },
  {
    value: "admin",
    label: "Administrator",
    help: "Can admit members and appoint other administrators. Invite with care.",
    bounded: false,
  },
];

/**
 * How long a guest's access lasts, in days.
 *
 * A starting position rather than a decision on the club's behalf. Ninety days
 * covers a speaker at a scheduled meeting and an author publishing a piece, the
 * two cases the brief names, with room for the conversation that follows either
 * one. An administrator changes it per invitation, so the club will settle this
 * by using it.
 */
export const GUEST_WINDOW_DAYS = 90;
export const GUEST_WINDOW_CHOICES = [30, 60, 90, 180, 365] as const;

/**
 * How long an invitation can be accepted for, in days.
 *
 * Separate from the guest's access window, and 0013 kept them in separate
 * columns for this reason. Fourteen days is long enough to survive a holiday
 * and short enough that a forwarded link stops working before anybody has
 * forgotten it was sent.
 */
export const INVITATION_VALID_DAYS = 14;

export interface InvitationRequest {
  email: string;
  role: InvitableRole;
  /** Days of access. Guests only; null for everyone else. */
  windowDays: number | null;
}

export type InvitationParse =
  | { ok: true; invitation: InvitationRequest }
  | { ok: false; error: string };

function plausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Read an invitation request off a request body. */
export function parseInvitationRequest(input: unknown): InvitationParse {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!plausibleEmail(email)) return { ok: false, error: "Enter a valid email address." };

  const role = typeof body.role === "string" ? body.role.trim() : "";
  if (!(INVITABLE_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: "Pick a role for this invitation." };
  }
  const typed = role as InvitableRole;

  const option = INVITABLE_ROLE_OPTIONS.find((o) => o.value === typed);
  if (!option?.bounded) {
    // A window on an unbounded role would be silently ignored by everything
    // downstream, which is worse than refusing it. Say so instead.
    if (body.windowDays !== undefined && body.windowDays !== null) {
      return { ok: false, error: "Only a guest has an access window." };
    }
    return { ok: true, invitation: { email, role: typed, windowDays: null } };
  }

  const raw = body.windowDays;
  const windowDays = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365 * 2) {
    return { ok: false, error: "Give the guest a window between 1 and 730 days." };
  }

  return { ok: true, invitation: { email, role: typed, windowDays } };
}

/** When an invitation stops being acceptable, given the moment it was issued. */
export function invitationExpiry(issuedAt: Date): Date {
  return addDays(issuedAt, INVITATION_VALID_DAYS);
}

/** When a guest's access lapses, or null for a role that does not lapse. */
export function accessExpiry(issuedAt: Date, windowDays: number | null): Date | null {
  return windowDays === null ? null : addDays(issuedAt, windowDays);
}

function addDays(from: Date, days: number): Date {
  const out = new Date(from.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * Whether an invitation can still be accepted.
 *
 * Every reason is checked here rather than spread across the redemption route,
 * so a reader can see the whole set at once and a test can cover it without a
 * database. The caller turns a reason into a message.
 */
export type InvitationState =
  | { usable: true }
  | { usable: false; reason: "accepted" | "revoked" | "expired" };

export function invitationState(
  invitation: { accepted_at: string | null; revoked_at: string | null; expires_at: string },
  now: Date,
): InvitationState {
  if (invitation.accepted_at) return { usable: false, reason: "accepted" };
  if (invitation.revoked_at) return { usable: false, reason: "revoked" };
  if (new Date(invitation.expires_at).getTime() <= now.getTime()) {
    return { usable: false, reason: "expired" };
  }
  return { usable: true };
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

export interface InvitationEmailCopy {
  subject: string;
  heading: string;
  bodyHtml: string;
  action: { label: string; url: string };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The invitation itself.
 *
 * It says what the club is for, because an invitation arriving unannounced from
 * an organization somebody has not heard of is indistinguishable from a
 * phishing attempt. It says who invited them for the same reason.
 */
export function invitationEmail(
  clubName: string,
  invitation: { role: InvitableRole; windowDays: number | null; invitedBy: string | null },
  acceptUrl: string,
): InvitationEmailCopy {
  const asGuest = invitation.role === "guest";

  const who = invitation.invitedBy
    ? `<p>${escape(invitation.invitedBy)} invited you.</p>`
    : "";

  const window =
    asGuest && invitation.windowDays
      ? `<p>Guest access runs for ${invitation.windowDays} days. Anything you publish
           stays available to the membership after that.</p>`
      : "";

  return {
    subject: `You are invited to ${clubName}`,
    heading: asGuest ? `Join ${clubName} as a guest` : `Join ${clubName}`,
    bodyHtml: `
      <p>${escape(clubName)} is a forum for people working in and around the
         electric grid to follow what AI is doing to the industry, and to publish
         what they are learning.</p>
      ${who}
      ${window}
      <p>The link below signs you in and completes your membership. There is no
         application to fill in and no approval to wait for. It works once and
         stops working after ${INVITATION_VALID_DAYS} days.</p>`,
    action: { label: "Accept the invitation", url: acceptUrl },
  };
}

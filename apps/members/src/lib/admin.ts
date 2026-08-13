/**
 * The approval queue's rules and copy (session 3d).
 *
 * Pure and framework-free, like lib/join.ts and for the same reason: what an
 * administrator may do, and what a member is told when they do it, are both
 * worth testing without a database or a browser.
 *
 * What is deliberately not here:
 *
 *  - **Guest approval.** A guest carries an access window, and who invites a
 *    guest and how long the window lasts is open item 7 in the build plan. The
 *    brief describes guests as invited rather than self-applying, so they
 *    arrive through the invitation path rather than this queue.
 *  - **Suspension and removal.** Member management is session 9. This queue
 *    answers one question, which is whether an applicant gets in.
 *
 * Role changes are here despite belonging to the same family as suspension,
 * because the whole point of this session is that James appoints the club's
 * real administrator and then steps back from the role.
 *
 * No em dashes anywhere, per the house rule.
 */

import { summarizeJoinAnswers } from "./join";

/** Roles an administrator may assign from the console. */
export const ASSIGNABLE_ROLES = ["member", "officer", "admin"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<AssignableRole, string> = {
  member: "Member",
  officer: "Officer",
  admin: "Administrator",
};

export const ROLE_DESCRIPTIONS: Record<AssignableRole, string> = {
  member: "Reads, writes, and takes part. What almost everyone should be.",
  officer: "Can moderate what is posted. Cannot admit or remove members.",
  admin: "Everything, including admitting members and appointing other administrators.",
};

export type AdminAction =
  | { kind: "approve"; memberId: string }
  | { kind: "decline"; memberId: string }
  | { kind: "set_role"; memberId: string; role: AssignableRole };

export type AdminActionParse =
  | { ok: true; action: AdminAction }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read an action off a request body.
 *
 * Strict about shape rather than forgiving, because every action here changes
 * somebody's access. An unrecognized action is refused rather than treated as
 * the nearest match: guessing at intent is not a thing to do with membership.
 */
export function parseAdminAction(input: unknown): AdminActionParse {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
  if (!UUID.test(memberId)) return { ok: false, error: "Which member was not clear." };

  const kind = typeof body.action === "string" ? body.action.trim() : "";

  if (kind === "approve") return { ok: true, action: { kind: "approve", memberId } };
  if (kind === "decline") return { ok: true, action: { kind: "decline", memberId } };

  if (kind === "set_role") {
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
      return { ok: false, error: "That is not a role this console can assign." };
    }
    return { ok: true, action: { kind: "set_role", memberId, role: role as AssignableRole } };
  }

  return { ok: false, error: "That action is not one this console performs." };
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
//
// Every message below is read by someone in the industry the build plan flags
// in section 3. Utilities operate under FERC and state regulators and are
// sensitive to anything reading as coordination between competitors, which is
// why "collaboration" came out of the landing page headline. The same care
// applies to mail the club sends in its own name, so the copy talks about
// sharing and publishing rather than working together.

export interface EmailCopy {
  subject: string;
  heading: string;
  bodyHtml: string;
  action?: { label: string; url: string };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** To the applicant, when an administrator lets them in. */
export function approvalEmail(clubName: string, memberUrl: string): EmailCopy {
  return {
    subject: `You are in: ${clubName}`,
    heading: "Your membership is approved",
    bodyHtml: `
      <p>An administrator has approved your request to join ${escape(clubName)}.</p>
      <p>The first thing to do is fill in your profile. It is what other members
         see, and it is what your articles are published under.</p>`,
    action: { label: "Open the member area", url: memberUrl },
  };
}

/**
 * To the applicant, when they are turned down.
 *
 * No reason is given, because the administrator was not asked for one and
 * inventing a plausible one would be worse than silence. What the message does
 * do is state the membership test and leave a door open, since the commonest
 * cause of a decline is an application that did not make the connection to the
 * industry clear rather than an applicant who does not belong.
 */
export function declineEmail(clubName: string): EmailCopy {
  return {
    subject: `About your request to join ${clubName}`,
    heading: "Your request was not approved",
    bodyHtml: `
      <p>An administrator has reviewed your request to join ${escape(clubName)}
         and has not approved it this time.</p>
      <p>Membership is limited to people working in or around the electric grid
         and the AI industry. If your work does connect and the application did
         not show it, reply to this email and an administrator will take another
         look.</p>`,
  };
}

/**
 * To the club's administrators, when somebody applies.
 *
 * The answers are in the message rather than only behind the link, because the
 * decision is small and an administrator reading this on a phone should be able
 * to form a view before deciding whether to open anything.
 */
export function newApplicationEmail(
  clubName: string,
  applicant: { displayName: string | null; email: string; joinAnswers: Record<string, unknown> },
  queueUrl: string,
): EmailCopy {
  const rows = summarizeJoinAnswers(applicant.joinAnswers)
    .map(
      (row) =>
        `<tr>
           <td style="padding:4px 12px 4px 0;color:#5b6f7d;vertical-align:top;white-space:nowrap">${escape(row.label)}</td>
           <td style="padding:4px 0">${escape(row.value)}</td>
         </tr>`,
    )
    .join("");

  const who = applicant.displayName?.trim() || applicant.email;

  return {
    subject: `${who} has asked to join ${clubName}`,
    heading: "A membership request is waiting",
    bodyHtml: `
      <p><strong>${escape(who)}</strong> (${escape(applicant.email)}) has asked to
         join ${escape(clubName)}.</p>
      ${rows ? `<table style="font-size:14px;margin:16px 0">${rows}</table>` : ""}
      <p>Nobody else is notified, so this waits until an administrator answers it.</p>`,
    action: { label: "Review the request", url: queueUrl },
  };
}

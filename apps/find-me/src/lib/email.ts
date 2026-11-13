import "server-only";
import { Resend } from "resend";

/**
 * Transactional email. Without RESEND_API_KEY it logs and returns false, and a
 * failure never blocks the action that triggered it (except sign in, which
 * cannot work without it).
 */

function sender(): string {
  const own = process.env.FM_EMAIL_FROM?.trim();
  if (own) return own;
  const shared = process.env.EMAIL_FROM?.trim() || "yourteam@doubleblaze.solutions";
  return shared.includes("<") ? shared : `Find Me <${shared}>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[find-me] email not sent (no RESEND_API_KEY): ${subject}`);
    return false;
  }
  try {
    const { error } = await new Resend(key).emails.send({ from: sender(), to, subject, html, replyTo });
    if (error) console.error("[find-me] email failed:", error.message);
    return !error;
  } catch (e) {
    console.error("[find-me] email threw:", e);
    return false;
  }
}

const wrap = (body: string) =>
  `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1E1B18;line-height:1.5">${body}<p style="color:#6B645C;font-size:13px;margin-top:32px">Find Me: local shelter pets, matched to you.</p></div>`;

export function sendSignInLink(to: string, url: string): Promise<boolean> {
  return send(
    to,
    "Your Find Me sign-in link",
    wrap(
      `<h1 style="font-size:22px">Tap to sign in</h1><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#E4572E;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Sign in to Find Me</a></p><p>This link works once and expires in an hour. If you did not ask for it, ignore this email.</p>`,
    ),
  );
}

export function sendInquiryToShelter(args: {
  to: string;
  shelterName: string;
  animalName: string;
  adopterName: string;
  adopterEmail: string;
  message: string;
  staffUrl: string;
}): Promise<boolean> {
  const { to, shelterName, animalName, adopterName, adopterEmail, message, staffUrl } = args;
  return send(
    to,
    `New Find Me inquiry: ${animalName}`,
    wrap(
      `<h1 style="font-size:22px">${escapeHtml(adopterName)} is interested in ${escapeHtml(animalName)}</h1>
      <p><strong>Email:</strong> ${escapeHtml(adopterEmail)}</p>
      ${message ? `<blockquote style="border-left:3px solid #E4572E;margin:0;padding-left:12px">${escapeHtml(message)}</blockquote>` : ""}
      <p>Reply to this email to reach them directly, or see every inquiry for ${escapeHtml(shelterName)}:</p>
      <p><a href="${escapeHtml(staffUrl)}">Open the shelter dashboard</a></p>`,
    ),
    adopterEmail,
  );
}

export function sendCareReminder(args: { to: string; petName: string; items: { title: string; due: string }[]; url: string }): Promise<boolean> {
  const { to, petName, items, url } = args;
  const list = items.map((i) => `<li><strong>${escapeHtml(i.title)}</strong> (due ${escapeHtml(i.due)})</li>`).join("");
  return send(
    to,
    `Coming up for ${petName}`,
    wrap(
      `<h1 style="font-size:22px">Coming up for ${escapeHtml(petName)}</h1><ul>${list}</ul><p><a href="${escapeHtml(url)}">Open ${escapeHtml(petName)}'s care plan</a></p>`,
    ),
  );
}

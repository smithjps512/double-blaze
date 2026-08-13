import "server-only";
import { Resend } from "resend";

/**
 * Sending mail from the member area.
 *
 * The sign-in route carried a copy of this and a note saying to extract a
 * package if a third copy appeared. Session 3d adds three more messages, so
 * this is that extraction, kept inside the members app rather than promoted to
 * a package: the platform's version sends from Double Blaze, this one sends as
 * the club, and merging them would mean a helper that has to be told which
 * identity it is wearing.
 *
 * Everything goes out through Resend on the club's verified domain rather than
 * Supabase's mailer, for the reasons written up in the sign-in route: it
 * survives spam filters, failures reach the bounce webhook rather than
 * vanishing, and it is not rate limited to a handful an hour.
 *
 * No em dashes anywhere, per the house rule.
 */

const FROM_ADDRESS = process.env.EMAIL_FROM?.trim() || "yourteam@doubleblaze.solutions";
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || process.env.LEAD_TO_EMAIL?.trim();

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ClubEmail {
  /** The club, so the message comes from a name a member recognizes. */
  clubName: string;
  to: string[];
  subject: string;
  /** The body, between the heading and the sign-off. Already escaped. */
  bodyHtml: string;
  /** An optional single call to action. */
  action?: { label: string; url: string };
  heading: string;
}

/**
 * Send one message as the club.
 *
 * Returns whether it went, and never throws. Every caller is in the middle of
 * something that already succeeded: a membership was created, a decision was
 * recorded. A failed email must not undo any of that, so failures are logged
 * loudly and swallowed. The bounce webhook is what catches the rest.
 */
export async function sendClubEmail(email: ClubEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[members] email not sent (no RESEND_API_KEY) subject=${email.subject}`);
    return false;
  }
  if (email.to.length === 0) return false;

  const action = email.action
    ? `<p style="margin:28px 0">
         <a href="${escapeHtml(email.action.url)}" style="background:#2f9e6f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(email.action.label)}</a>
       </p>`
    : "";

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: `${email.clubName} <${FROM_ADDRESS}>`,
      to: email.to,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      subject: email.subject,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#132330">
          <h1 style="color:#0d2b45;font-size:20px">${escapeHtml(email.heading)}</h1>
          ${email.bodyHtml}
          ${action}
          <p style="color:#5b6f7d;font-size:13px;border-top:1px solid #dbe3e8;padding-top:16px">
            ${escapeHtml(email.clubName)}
          </p>
        </div>`,
    });

    if (error) {
      console.error(`[members] email failed subject=${email.subject}: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[members] email threw subject=${email.subject}:`, err);
    return false;
  }
}

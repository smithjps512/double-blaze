import "server-only";
import { Resend } from "resend";
import { siteUrl } from "./data";

/**
 * A short thank-you after the first submission. Optional: without
 * RESEND_API_KEY and EMAIL_FROM it does nothing, and a failure never blocks
 * the survey.
 */
/**
 * Sends as "Paint Your Spot" from the verified Double Blaze domain unless
 * PYS_EMAIL_FROM names a full sender.
 */
function sender(): string {
  const own = process.env.PYS_EMAIL_FROM?.trim();
  if (own) return own;
  const shared = process.env.EMAIL_FROM?.trim() || "yourteam@doubleblaze.solutions";
  return shared.includes("<") ? shared : `Paint Your Spot <${shared}>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The one-tap sign-in link. Returns whether Resend accepted it, so the page
 * can say so instead of promising an email that never left.
 */
export async function sendSignInLink(to: string, url: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[paint-your-spot] sign-in link not sent: RESEND_API_KEY is not set");
    return false;
  }
  try {
    const { error } = await new Resend(key).emails.send({
      from: sender(),
      to,
      replyTo: process.env.PYS_REPLY_TO || undefined,
      subject: "Your Paint Your Spot sign-in link",
      text: [
        "Tap this link to sign in and show your interest in Paint Your Spot:",
        url,
        "",
        "It works once and expires in an hour. If you did not ask for it, ignore this email.",
        "",
        "The BMS Beautification Committee",
      ].join("\n"),
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1B1D21">
          <h1 style="color:#0659A8;font-size:22px">Paint Your Spot</h1>
          <p>Tap the button to sign in and show your interest.</p>
          <p style="margin:28px 0">
            <a href="${escapeHtml(url)}" style="background:#0659A8;color:#FFED34;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:700">Sign in to Paint Your Spot</a>
          </p>
          <p style="color:#5D6169;font-size:13px">It works once and expires in an hour. If you did not ask for it, ignore this email.</p>
          <p style="color:#5D6169;font-size:13px">The BMS Beautification Committee</p>
        </div>`,
    });
    if (error) {
      console.error("[paint-your-spot] sign-in email failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[paint-your-spot] sign-in email failed:", err);
    return false;
  }
}

export async function sendConfirmation(to: string, name: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = sender();
  if (!key) return;
  const first = name.split(/\s+/)[0] || "there";
  const url = siteUrl();
  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to,
      replyTo: process.env.PYS_REPLY_TO || undefined,
      subject: "Your Paint Your Spot interest is on file",
      text: [
        `Hi ${first},`,
        "",
        "Thanks for raising your hand for Paint Your Spot. Your answers are on file, and you can change them any time:",
        `${url}/interest`,
        "",
        "No money is due and nothing is reserved yet. The fundraiser only goes ahead if enough staff want in. If it does, we will email again when spots open.",
        "",
        "Know someone who would want a spot? Send them this:",
        url,
        "",
        "The BMS Beautification Committee",
      ].join("\n"),
    });
    if (error) console.error("[paint-your-spot] confirmation email failed:", error.message);
  } catch (err) {
    console.error("[paint-your-spot] confirmation email failed:", err);
  }
}

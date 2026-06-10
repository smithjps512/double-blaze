import "server-only";
import { Resend } from "resend";
import { BRAND } from "./brand";
import { SITE_URL } from "./site";

/**
 * Transactional email (spec section 7). Guarded: without RESEND_API_KEY we log
 * that the email was skipped and return, so flows still complete in dev. We
 * never log the API key or full message bodies containing PII beyond the
 * recipient.
 */
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = `Double Blaze <${process.env.LEADS_FROM_EMAIL ?? BRAND.email}>`;

async function send(to: string, subject: string, html: string, tag: string) {
  const resend = getResend();
  if (!resend) {
    console.info(`[email] ${tag} skipped (no RESEND_API_KEY) to=${to}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
  if (error) {
    console.error(`[email] ${tag} failed:`, error);
    return;
  }
  console.info(`[email] ${tag} sent to=${to}`);
}

function wrap(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1C1A19">
      <h1 style="color:#630031;font-size:20px">${title}</h1>
      ${bodyHtml}
      <p style="color:#75787B;font-size:12px;margin-top:32px">${BRAND.legalLine}</p>
    </div>`;
}

/** Workflow step 1: purchase confirmation. */
export async function sendPurchaseConfirmation(to: string, offeringName: string) {
  await send(
    to,
    "Thanks for your purchase",
    wrap(
      "Your purchase is confirmed",
      `<p>Thanks for choosing Double Blaze. We have received your purchase of
        <strong>${offeringName}</strong>.</p>
       <p>Next, we will invite you to set up your account so we can start your
        project. Watch for a separate account-setup email.</p>`,
    ),
    "purchase-confirmation",
  );
}

/** Workflow step 2: account setup invitation (magic link sent by Clerk). */
export async function sendAccountSetup(to: string) {
  await send(
    to,
    "Set up your Double Blaze account",
    wrap(
      "Set up your account",
      `<p>You are almost there. We have sent you a secure invitation to create
        your Double Blaze client account. Open the invitation email from Clerk to
        finish setting up, then complete your organization profile.</p>
       <p>Once you are in, your project dashboard lives at
        <a href="${SITE_URL}/portal" style="color:#B23A18">${SITE_URL}/portal</a>.</p>`,
    ),
    "account-setup",
  );
}

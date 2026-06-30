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

/**
 * Notifies the region lead (or central inbox) of a new waitlist interest from a
 * coming_soon region. `to` is resolved by the caller: the region lead's email
 * when active, otherwise the central inbox.
 */
export async function sendRegionInterest(
  to: string,
  opts: { regionName: string; name: string; email: string; message?: string },
) {
  const safeName = opts.name || "Someone";
  await send(
    to,
    `New interest in Double Blaze — ${opts.regionName}`,
    wrap(
      `New ${opts.regionName} interest`,
      `<p><strong>${escapeHtml(safeName)}</strong> joined the list for
        <strong>${escapeHtml(opts.regionName)}</strong>.</p>
       <p><strong>Email:</strong> ${escapeHtml(opts.email)}</p>
       ${opts.message ? `<p><strong>Note:</strong> ${escapeHtml(opts.message)}</p>` : ""}`,
    ),
    "region-interest",
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Trail Run signup confirmation. No charge has been made: this confirms the
 * card is on file and explains that the 30-day window starts at launch. We do
 * not call it a free trial, per the program brief.
 */
export async function sendTrailRunSignupConfirmation(to: string) {
  await send(
    to,
    "Welcome to Trail Run",
    wrap(
      "You are in. No charge yet.",
      `<p>Thanks for starting Trail Run with Double Blaze. We have your card on
        file and you have not been charged anything.</p>
       <p>Here is what happens next. We build your solution, then your 30-day
        window starts the day it goes live, not today, so build time never eats
        your evaluation. You will see exactly what it produces before you decide.
        You can stop anytime before the window ends with no charge.</p>
       <p>Watch for a separate email to set up your account so we can begin.</p>`,
    ),
    "trail-run-signup",
  );
}

/**
 * Notifies a project lead or admin that a Trail Run Build Brief is ready and
 * the build workspace has been created (Sprint T2 routing). `to` is the lead's
 * or admin's email; the link points at the internal workspace.
 */
export async function sendTrailRunBriefReady(
  to: string,
  opts: { organizationName: string | null; workspacePath: string; flagCount: number },
) {
  const org = opts.organizationName || "A new Trail Run client";
  const flagLine =
    opts.flagCount > 0
      ? `<p>${opts.flagCount} feasibility ${opts.flagCount === 1 ? "flag" : "flags"} ${opts.flagCount === 1 ? "was" : "were"} raised for your review.</p>`
      : "";
  await send(
    to,
    "Trail Run build brief ready",
    wrap(
      "A build brief is ready",
      `<p><strong>${escapeHtml(org)}</strong> finished Trail Run intake. Spark
        has assembled their build brief and the Blue Trail checklist is seeded.</p>
       ${flagLine}
       <p>Open the build workspace to review the brief and start the build:
        <a href="${SITE_URL}${opts.workspacePath}" style="color:#B23A18">${SITE_URL}${opts.workspacePath}</a>.</p>`,
    ),
    "trail-run-brief-ready",
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

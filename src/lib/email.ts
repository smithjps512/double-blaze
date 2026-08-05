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

const FROM = `Double Blaze <${BRAND.email}>`;

/** Internal routing address for Trailhead intakes. Never shown to customers. */
const TRAILHEAD_INTERNAL_EMAIL = "yourteam+intake@doubleblaze.solutions";

/**
 * The outcome of one send attempt. `ok` is true only when Resend accepted the
 * message. `reason` is a short, client-safe explanation on failure so callers
 * can log it and surface it (never the API key, never the message body).
 */
export interface EmailResult {
  ok: boolean;
  reason?: string;
}

/**
 * Sends one transactional email. Returns { ok: true } only when Resend reports
 * a successful send. On any failure it returns { ok: false, reason } instead of
 * throwing, so best-effort callers stay non-blocking while still being able to
 * see and record what went wrong. A dropped email must never be invisible.
 */
async function send(
  to: string,
  subject: string,
  html: string,
  tag: string,
): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] ${tag} not sent (no RESEND_API_KEY) to=${to}`);
    return { ok: false, reason: "Email is not configured (no RESEND_API_KEY)." };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
    if (error) {
      // Resend returns { name, message } on rejection: a bad from-domain, an
      // unverified sender, a suppressed recipient, or a key without send scope.
      const reason = error.message || error.name || "Resend rejected the send.";
      console.error(`[email] ${tag} failed to=${to}: ${reason}`);
      return { ok: false, reason };
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown send error.";
    console.error(`[email] ${tag} threw to=${to}: ${reason}`);
    return { ok: false, reason };
  }
  console.info(`[email] ${tag} sent to=${to}`);
  return { ok: true };
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

/** Escape a value destined for a double-quoted HTML attribute (e.g. href). */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
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

/**
 * Launch notification (Sprint T3). Sent when a build goes live: the live URL
 * and the client-safe rendered summary of what we built. Never includes the
 * internal brief or feasibility flags.
 */
export async function sendTrailRunLaunch(
  to: string,
  opts: { liveUrl: string; summary: string; portalUrl: string },
) {
  await send(
    to,
    "Your Trail Run solution is live",
    wrap(
      "You are live. Your 30-day window starts now.",
      `<p>Your Blue Trail solution is live and your 30-day window has started.
        Here it is:</p>
       <p><a href="${escapeHtml(opts.liveUrl)}" style="color:#B23A18">${escapeHtml(opts.liveUrl)}</a></p>
       <p>Here is a summary of what we built:</p>
       <pre style="white-space:pre-wrap;font-family:inherit;color:#1C1A19">${escapeHtml(opts.summary)}</pre>
       <p>We will check in along the way to show you what it is producing. You
        can see your results and your options anytime in your portal:
        <a href="${opts.portalUrl}" style="color:#B23A18">${opts.portalUrl}</a>.</p>`,
    ),
    "trail-run-launch",
  );
}

/** Value-forward check-in subject lines, from docs/trail-run-messaging.md. */
const CHECKIN_SUBJECTS: Record<number, string> = {
  14: "Here is what your new site has done in two weeks",
  7: "Your results so far, and your options",
  3: "A quick look at what we built, and what is next",
  1: "Your month is up tomorrow. Here is where you stand.",
};

/**
 * A value check-in (Sprint T3). Opens with results (or a graceful note when no
 * metrics are flowing yet), then the three options, and links to the portal.
 * Value-forward, never a countdown.
 */
export async function sendTrailRunCheckin(
  to: string,
  opts: { day: number; liveUrl: string | null; portalUrl: string },
): Promise<boolean> {
  const subject = CHECKIN_SUBJECTS[opts.day] ?? "Your Trail Run check-in";
  const liveLine = opts.liveUrl
    ? `<p>Your solution is live at <a href="${escapeHtml(opts.liveUrl)}" style="color:#B23A18">${escapeHtml(opts.liveUrl)}</a>.</p>`
    : "";
  const result = await send(
    to,
    subject,
    wrap(
      "Here is where things stand",
      `<p>Here is what your Blue Trail solution has been doing. Open your portal
        for the live numbers as they come in.</p>
       ${liveLine}
       <p>Whenever you are ready, you have three options: continue at your
        current level, change your level, or stop. You will only be charged if
        you continue.</p>
       <p><a href="${opts.portalUrl}" style="color:#B23A18">See your results and choose</a></p>`,
    ),
    `trail-run-checkin-${opts.day}`,
  );
  return result.ok;
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

// ---------------------------------------------------------------------------
// Trailhead emails
// ---------------------------------------------------------------------------

/**
 * Send helper for Trailhead customer-facing emails. Uses the same FROM as all
 * other mail. The customer never sees the internal routing address.
 */
async function sendTrailhead(
  to: string,
  subject: string,
  html: string,
  tag: string,
): Promise<EmailResult> {
  return send(to, subject, html, tag);
}

/**
 * The one durable line every Trailhead email carries: the customer's status
 * URL. Email is a convenience, not the way back in. This is the resilience fix:
 * if an email is lost, the bookmarked status link still holds the whole flow.
 */
function statusUrlBlock(statusUrl: string): string {
  return `<p style="margin-top:24px;padding:12px 16px;background:#F6F4F1;border-radius:8px;font-size:14px;color:#1C1A19">
      Your status page is always here, and it stays current at every step:<br>
      <a href="${escapeAttr(statusUrl)}" style="color:#B23A18">${escapeHtml(statusUrl)}</a><br>
      <span style="color:#75787B">Bookmark it. You can get back to your site from that link anytime, even if an email goes missing.</span>
    </p>`;
}

/**
 * Internal routing: notify staff of a new Trailhead intake. Sent to
 * TRAILHEAD_INTERNAL_EMAIL, never exposed to the customer in any way.
 */
export async function sendTrailheadIntakeNotification(opts: {
  siteName: string;
  subdomain: string;
  contactName: string;
  contactEmail: string;
  siteType: string;
  intakeId: string;
}): Promise<EmailResult> {
  return send(
    TRAILHEAD_INTERNAL_EMAIL,
    `Trailhead intake: ${opts.siteName}`,
    wrap(
      "New Trailhead intake",
      `<p><strong>${escapeHtml(opts.contactName)}</strong> submitted a Trailhead
        intake for <strong>${escapeHtml(opts.siteName)}</strong>
        (${escapeHtml(opts.subdomain)}.doubleblaze.solutions).</p>
       <p><strong>Type:</strong> ${escapeHtml(opts.siteType)}</p>
       <p><strong>Email:</strong> ${escapeHtml(opts.contactEmail)}</p>
       <p>Review the intake in the execution portal:
        <a href="${SITE_URL}/execution/trailhead/${opts.intakeId}" style="color:#B23A18">Open intake</a>.</p>`,
    ),
    "trailhead-intake-internal",
  );
}

/**
 * Internal routing: notify staff that a customer asked us to fix something on
 * their previewed or published Trailhead site. Sent to TRAILHEAD_INTERNAL_EMAIL,
 * never exposed to the customer. The customer's message is escaped before it is
 * placed in the HTML.
 */
export async function sendTrailheadCorrectionNotification(opts: {
  siteName: string;
  subdomain: string;
  description: string;
  intakeId: string;
  contactEmail?: string;
}): Promise<EmailResult> {
  return send(
    TRAILHEAD_INTERNAL_EMAIL,
    `Trailhead correction: ${opts.siteName}`,
    wrap(
      "Correction requested",
      `<p>The customer for <strong>${escapeHtml(opts.siteName)}</strong>
        (${escapeHtml(opts.subdomain)}.doubleblaze.solutions) asked us to fix something.</p>
       <p><strong>What they said:</strong></p>
       <p style="white-space:pre-wrap">${escapeHtml(opts.description)}</p>
       ${opts.contactEmail ? `<p><strong>Reply to:</strong> ${escapeHtml(opts.contactEmail)}</p>` : ""}
       <p>Open it in the execution portal:
        <a href="${SITE_URL}/execution/trailhead/${opts.intakeId}" style="color:#B23A18">Open site</a>.</p>`,
    ),
    "trailhead-correction-internal",
  );
}

/**
 * Customer confirmation: we received your Trailhead intake. Sent from
 * yourteam@doubleblaze.solutions.
 */
export async function sendTrailheadConfirmation(to: string, opts: {
  contactName: string;
  siteName: string;
  subdomain: string;
  statusUrl: string;
}): Promise<EmailResult> {
  return sendTrailhead(
    to,
    `We got your site request: ${opts.siteName}`,
    wrap(
      "We are on it",
      `<p>Hi ${escapeHtml(opts.contactName)},</p>
       <p>We received your Trailhead request for
        <strong>${escapeHtml(opts.siteName)}</strong>
        (${escapeHtml(opts.subdomain)}.doubleblaze.solutions).</p>
       <p>Here is what happens next. We will draft your site messaging, page
        copy, and look and feel from what you told us, then send it to you to
        review and approve before we build anything. You will hear from us
        soon.</p>
       ${statusUrlBlock(opts.statusUrl)}
       <p>If you have questions in the meantime, just reply to this email.</p>`,
    ),
    "trailhead-confirmation",
  );
}

/**
 * Content review: Spark drafted the content, customer reviews and approves.
 * Sent from yourteam@doubleblaze.solutions.
 */
export async function sendTrailheadContentReview(to: string, opts: {
  contactName: string;
  siteName: string;
  statusUrl: string;
}): Promise<EmailResult> {
  return sendTrailhead(
    to,
    `Your site draft is ready to review: ${opts.siteName}`,
    wrap(
      "Your site draft is ready",
      `<p>Hi ${escapeHtml(opts.contactName)},</p>
       <p>We have drafted the messaging, page copy, and look for
        <strong>${escapeHtml(opts.siteName)}</strong>. Please review it and let
        us know if anything needs to change before we build.</p>
       <p><a href="${escapeAttr(opts.statusUrl)}" style="color:#B23A18">Review your site draft</a></p>
       ${statusUrlBlock(opts.statusUrl)}
       <p>Once you approve, we will build it and send you a private preview.</p>`,
    ),
    "trailhead-content-review",
  );
}

/**
 * Preview: the built site is ready for the customer to see.
 * Sent from yourteam@doubleblaze.solutions.
 */
export async function sendTrailheadPreview(to: string, opts: {
  contactName: string;
  siteName: string;
  statusUrl: string;
}): Promise<EmailResult> {
  return sendTrailhead(
    to,
    `Your site is ready to preview: ${opts.siteName}`,
    wrap(
      "Your site is built",
      `<p>Hi ${escapeHtml(opts.contactName)},</p>
       <p><strong>${escapeHtml(opts.siteName)}</strong> is built and ready for
        you to see.</p>
       <p><a href="${escapeAttr(opts.statusUrl)}" style="color:#B23A18">Preview your site</a></p>
       ${statusUrlBlock(opts.statusUrl)}
       <p>If everything looks right, accept it and we will publish it at your
        chosen address. If we got something wrong (a misspelling, the wrong
        colors, copy that does not match what you approved) let us know and
        we will fix it.</p>`,
    ),
    "trailhead-preview",
  );
}

/**
 * Published: the site is live. Includes the tip link.
 * Sent from yourteam@doubleblaze.solutions.
 */
export async function sendTrailheadPublished(to: string, opts: {
  contactName: string;
  siteName: string;
  liveUrl: string;
  statusUrl: string;
}): Promise<EmailResult> {
  return sendTrailhead(
    to,
    `${opts.siteName} is live`,
    wrap(
      "You are live",
      `<p>Hi ${escapeHtml(opts.contactName)},</p>
       <p><strong>${escapeHtml(opts.siteName)}</strong> is published and live at
        <a href="${escapeAttr(opts.liveUrl)}" style="color:#B23A18">${escapeHtml(opts.liveUrl)}</a>.</p>
       <p>A site like this normally runs a few thousand dollars to have built.
        You are going to pay whatever you think it was worth. There is no
        minimum, and there is no catch. Your site stays live whether you tip
        or not.</p>
       <p>You do not have to decide today. The tip link is permanent, so if this
        site brings you your first customer or your next ten members and you want
        to come back and tip then, it will still be there.</p>
       <p><a href="${escapeAttr(opts.statusUrl)}" style="color:#B23A18">Your Trailhead status page</a>:
        tip, export your files, request a correction, or upgrade whenever you
        are ready.</p>
       ${statusUrlBlock(opts.statusUrl)}`,
    ),
    "trailhead-published",
  );
}

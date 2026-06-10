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

/** Workflow step 3: the brief is ready for the client to review and accept. */
export async function sendBriefReadyForAcceptance(to: string, offeringName: string) {
  await send(
    to,
    "Your project brief is ready",
    wrap(
      "Your project brief is ready",
      `<p>Thanks for completing your Spark intake. We have assembled the project
        brief for your <strong>${offeringName}</strong> work.</p>
       <p>Please review it and accept, or request changes, in your portal:
        <a href="${SITE_URL}/portal" style="color:#B23A18">${SITE_URL}/portal</a>.</p>
       <p>Accepting the brief sets the scope and kicks off your project.</p>`,
    ),
    "brief-ready-for-acceptance",
  );
}

/** Workflow step 4: the client accepted the brief; confirm and set expectations. */
export async function sendBriefAccepted(to: string, offeringName: string) {
  await send(
    to,
    "Your project is underway",
    wrap(
      "Brief accepted, project underway",
      `<p>You accepted the brief for your <strong>${offeringName}</strong> work.
        Thank you. Your project lead will reach out to schedule a kickoff call.</p>
       <p>Track progress and deliverables anytime in your portal:
        <a href="${SITE_URL}/portal" style="color:#B23A18">${SITE_URL}/portal</a>.</p>`,
    ),
    "brief-accepted",
  );
}

/** Workflow step 4: notify the project lead of a newly accepted project. */
export async function sendNewAcceptedProject(
  to: string,
  details: { offeringName: string; organizationName: string | null },
) {
  const org = details.organizationName ?? "A new client";
  await send(
    to,
    "New accepted project",
    wrap(
      "New project accepted",
      `<p><strong>${org}</strong> accepted their brief for
        <strong>${details.offeringName}</strong>. It is ready for kickoff.</p>
       <p>Open the execution portal to schedule the kickoff and start delivery:
        <a href="${SITE_URL}/execution" style="color:#B23A18">${SITE_URL}/execution</a>.</p>`,
    ),
    "new-accepted-project",
  );
}

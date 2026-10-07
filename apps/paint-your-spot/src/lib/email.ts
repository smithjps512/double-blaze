import "server-only";
import { Resend } from "resend";
import { siteUrl } from "./data";

/**
 * A short thank-you after the first submission. Optional: without
 * RESEND_API_KEY and EMAIL_FROM it does nothing, and a failure never blocks
 * the survey.
 */
export async function sendConfirmation(to: string, name: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.PYS_EMAIL_FROM || process.env.EMAIL_FROM;
  if (!key || !from) return;
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
        "No money is due and nothing is reserved yet. We will email again when spots open up.",
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

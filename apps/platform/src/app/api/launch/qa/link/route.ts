import { NextResponse } from "next/server";
import { approvalLinksAreConfigured, qaReviewLink } from "@/lib/trail-crew-approval-link";
import { pendingCount } from "@/lib/launch-qa-db";
import { sendLaunchQaLink } from "@/lib/email";

/**
 * POST /api/launch/qa/link
 *
 * Emails the teacher a signed link to /play/review. Public, because it can
 * only send one email to the one configured address, and rate limited.
 */
let lastSentAt = 0;
const MIN_GAP_MS = 5 * 60_000;

export async function POST() {
  if (!approvalLinksAreConfigured()) {
    return NextResponse.json(
      { error: "Email links are not switched on for this site yet. Ask whoever runs it to set TRAIL_CREW_APPROVAL_SECRET." },
      { status: 400 },
    );
  }
  const now = Date.now();
  if (now - lastSentAt < MIN_GAP_MS) {
    return NextResponse.json({ error: "A link was sent a few minutes ago. Check the inbox, then try again in five minutes." }, { status: 429 });
  }
  const url = qaReviewLink();
  if (!url) return NextResponse.json({ error: "Could not make a link." }, { status: 500 });
  const sent = await sendLaunchQaLink(url, await pendingCount());
  if (!sent.ok) return NextResponse.json({ error: `Could not send it: ${sent.reason}` }, { status: 500 });
  lastSentAt = now;
  return NextResponse.json({ ok: true, message: "Sent. Check the teacher's inbox." });
}

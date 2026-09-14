import { NextResponse } from "next/server";
import { approvalLinksAreConfigured, queueLink } from "@/lib/trail-crew-approval-link";
import { listEdits } from "@/lib/trail-crew-edits";
import { sendTrailCrewQueueLink } from "@/lib/email";

/**
 * POST /api/trail-crew/queue-link
 *
 * Emails the teacher a fresh signed link to the whole queue. Public, because
 * the only thing it can do is send one email to the one configured address,
 * and rate limited so a bored student cannot fill that inbox.
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
    return NextResponse.json(
      { error: "A link was sent a few minutes ago. Check the inbox, then try again in five minutes." },
      { status: 429 },
    );
  }
  const url = queueLink();
  if (!url) return NextResponse.json({ error: "Could not make a link." }, { status: 500 });
  const pending = (await listEdits("pending")).length;
  const sent = await sendTrailCrewQueueLink(url, pending);
  if (!sent.ok) return NextResponse.json({ error: `Could not send it: ${sent.reason}` }, { status: 500 });
  lastSentAt = now;
  return NextResponse.json({ ok: true, message: "Sent. Check the teacher's inbox." });
}

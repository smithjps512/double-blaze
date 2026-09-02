import { NextResponse, type NextRequest } from "next/server";
import {
  MAX_PROPOSAL_LENGTH,
  MAX_REASON_LENGTH,
  screenProposal,
  submitEdit,
  teamExists,
  teamLabel,
} from "@/lib/trail-crew-edits";
import { sendTrailCrewProposal } from "@/lib/email";

/**
 * POST /api/trail-crew/suggest
 *
 * A team proposes a change to one of their user stories. Anonymous and
 * team-scoped, like the helper: the slug comes from the page they are on and
 * nothing about the student is collected.
 *
 * This route cannot change a document. It stores a proposal and tells the
 * teacher. That is the entire guarantee behind letting twelve year olds type
 * into it.
 */
export const maxDuration = 60;

const recent = new Map<string, number[]>();
const WINDOW_MS = 300_000;
const MAX_PER_WINDOW = 5;

function throttled(slug: string): boolean {
  const now = Date.now();
  const hits = (recent.get(slug) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(slug, hits);
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = typeof body.team === "string" ? body.team : "";
  const storyHeading = typeof body.story === "string" ? body.story.trim() : "";
  const originalText = typeof body.original === "string" ? body.original : "";
  const proposedText = typeof body.proposed === "string" ? body.proposed.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!slug || !teamExists(slug)) {
    return NextResponse.json({ error: "I do not know this team." }, { status: 400 });
  }
  if (!storyHeading || !proposedText) {
    return NextResponse.json(
      { error: "Pick a story and write what you want it to say." },
      { status: 400 },
    );
  }
  if (proposedText.length > MAX_PROPOSAL_LENGTH || reason.length > MAX_REASON_LENGTH) {
    return NextResponse.json({ error: "That is longer than a user story needs to be." }, { status: 400 });
  }
  if (proposedText === originalText.trim()) {
    return NextResponse.json(
      { error: "That is what it already says. Change something first." },
      { status: 400 },
    );
  }
  if (throttled(slug)) {
    return NextResponse.json(
      { error: "You have sent a few of these already. Give it a few minutes." },
      { status: 429 },
    );
  }

  const { flagged, flagReason } = await screenProposal({ proposed: proposedText, reason });

  const stored = await submitEdit({
    slug,
    storyHeading,
    originalText,
    proposedText,
    reason,
    flagged,
    flagReason,
  });
  if (!stored.ok) {
    return NextResponse.json(
      { error: "I could not save that. Tell your teacher rather than trying again." },
      { status: 200 },
    );
  }

  const email = await sendTrailCrewProposal({
    teamLabel: teamLabel(slug),
    storyHeading,
    originalText,
    proposedText,
    reason,
    flagged,
    flagReason,
  });
  if (!email.ok) {
    // The proposal is safely stored and visible in the queue, so a failed
    // notification is worth logging and not worth failing the submission over.
    console.error(`[trail-crew] proposal ${stored.id} stored but not emailed`);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Sent to your teacher. Nothing changes until he approves it, and you will see it in your story when he does.",
  });
}

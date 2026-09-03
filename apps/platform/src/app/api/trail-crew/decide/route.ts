import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { auth } from "@clerk/nextjs/server";
import { getEdit, recordDecision } from "@/lib/trail-crew-edits";
import { publishStoryEdit, publishingIsConfigured } from "@/lib/trail-crew-publish";

/**
 * POST /api/trail-crew/decide
 *
 * Staff only. Approving commits the change to the repository, which triggers a
 * rebuild, which regenerates the team's prototype and coach notes.
 *
 * The order matters: commit first, record second. A commit that succeeds while
 * the record fails leaves a proposal that looks pending but is already live,
 * which a teacher can see and re-decide harmlessly. The reverse would mark a
 * change applied that never reached the file, and nobody would ever know.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await requireStaff())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : null;
  // The teacher may fix the wording before approving, which is usually the
  // right move with a first attempt from a twelve year old.
  const editedText = typeof body.text === "string" ? body.text.trim() : "";

  if (!id || !decision) {
    return NextResponse.json({ error: "Missing id or decision." }, { status: 400 });
  }

  const edit = await getEdit(id);
  if (!edit) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  if (edit.status !== "pending") {
    return NextResponse.json({ error: `Already ${edit.status}.` }, { status: 409 });
  }

  const { userId } = await auth();
  const decidedBy = userId ?? "staff";

  if (decision === "reject") {
    const done = await recordDecision({ id, status: "rejected", decidedBy });
    return done
      ? NextResponse.json({ ok: true, status: "rejected" })
      : NextResponse.json({ error: "Could not record that." }, { status: 500 });
  }

  if (!publishingIsConfigured()) {
    return NextResponse.json(
      { error: "Approving writes to the repository, and GITHUB_TOKEN is not set." },
      { status: 400 },
    );
  }

  const approvedText = editedText || edit.proposed_text;
  const published = await publishStoryEdit({
    slug: edit.team_slug,
    storyHeading: edit.story_heading,
    approvedText,
    decidedBy,
  });
  if (!published.ok) {
    return NextResponse.json({ error: published.error ?? "Could not commit." }, { status: 500 });
  }

  await recordDecision({ id, status: "approved", decidedBy, appliedText: approvedText });
  return NextResponse.json({ ok: true, status: "approved", commitUrl: published.commitUrl });
}

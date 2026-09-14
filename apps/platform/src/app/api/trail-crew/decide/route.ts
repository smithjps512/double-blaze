import { NextResponse, after, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { auth } from "@clerk/nextjs/server";
import { getEdit, recordDecision, submitArchitectureDraft, teamLabel } from "@/lib/trail-crew-edits";
import {
  publishArchitecture,
  publishCardsForStory,
  publishStoryEdit,
  publishingIsConfigured,
  readRepoFile,
} from "@/lib/trail-crew-publish";
import { draftArchitecture } from "@/lib/trail-crew-architect";
import { sendTrailCrewArchitectureDraft } from "@/lib/email";

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
 *
 * Approving a story now fans out. Right behind the story commit, the build
 * card for that story is rewritten from it and committed (no model, by rule).
 * Then, after the response has gone back to the teacher, Spark drafts the
 * architecture change and puts it in this same queue for the teacher to read.
 * The draft is the only part a model writes, and it is the only part that
 * needs a second approval.
 *
 * Approving an architecture draft commits the whole page.
 */
export const maxDuration = 300;

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

  // --- An architecture draft: the whole page, committed -------------------
  if (edit.kind === "architecture") {
    const published = await publishArchitecture({
      slug: edit.team_slug,
      approvedText,
      storyHeading: edit.story_heading,
      decidedBy,
    });
    if (!published.ok) {
      return NextResponse.json({ error: published.error ?? "Could not commit." }, { status: 500 });
    }
    await recordDecision({ id, status: "approved", decidedBy, appliedText: approvedText });
    return NextResponse.json({ ok: true, status: "approved", commitUrl: published.commitUrl });
  }

  // --- A story: commit it, then its card, then queue the architecture -----
  const published = await publishStoryEdit({
    slug: edit.team_slug,
    storyHeading: edit.story_heading,
    approvedText,
    decidedBy,
    kind: edit.kind,
  });
  if (!published.ok) {
    return NextResponse.json({ error: published.error ?? "Could not commit." }, { status: 500 });
  }
  await recordDecision({ id, status: "approved", decidedBy, appliedText: approvedText });

  const cards = published.markdown
    ? await publishCardsForStory({
        slug: edit.team_slug,
        storyHeading: edit.story_heading,
        storiesMarkdown: published.markdown,
        decidedBy,
      })
    : { ok: false as const, error: "No stories file came back from the commit." };
  if (!cards.ok) console.error(`[trail-crew] card rewrite failed for ${edit.team_slug}: ${cards.error}`);

  // The architecture draft takes a model call that can run long, so it
  // happens after the teacher has their answer. The draft goes into the queue
  // and an email says so; if it fails, the teacher has a story and a card that
  // are right, and an architecture page that says it has fallen behind.
  const storiesMarkdown = published.markdown;
  const cardsMarkdown = cards.ok ? cards.cardsMarkdown : undefined;
  const cardsAction = cards.ok ? cards.action : undefined;
  after(async () => {
    try {
      const current = await readRepoFile(`docs/students/${edit.team_slug}/build-architecture.md`);
      const currentArchitecture = current.ok && !("missing" in current) ? current.content : undefined;
      const draft = await draftArchitecture({
        slug: edit.team_slug,
        storyHeading: edit.story_heading,
        storyText: approvedText,
        currentArchitecture,
        cardsMarkdown,
        storiesMarkdown,
      });
      if (!draft.ok || !draft.markdown) {
        console.error(`[trail-crew] architecture draft for ${edit.team_slug} not made: ${draft.reason}`);
        return;
      }
      const before = (currentArchitecture ?? "").split("\n");
      const afterLines = draft.markdown.split("\n");
      const changed = afterLines.filter((l) => !before.includes(l)).length;
      const reason = currentArchitecture
        ? `Drafted after "${edit.story_heading}" was approved. ${changed} ${changed === 1 ? "line is" : "lines are"} new or changed on the page; everything else is as it was.`
        : `This team had no architecture page. Drafted from their cards and stories after "${edit.story_heading}" was approved.`;
      const stored = await submitArchitectureDraft({
        slug: edit.team_slug,
        storyHeading: edit.story_heading,
        currentArchitecture: currentArchitecture ?? "",
        draft: draft.markdown,
        reason,
      });
      if (stored.ok) {
        await sendTrailCrewArchitectureDraft({
          teamLabel: teamLabel(edit.team_slug),
          storyHeading: edit.story_heading,
          reason,
          cardsAction,
        });
      }
    } catch (err) {
      console.error(
        `[trail-crew] architecture draft for ${edit.team_slug} failed:`,
        err instanceof Error ? err.message : "unknown error",
      );
    }
  });

  return NextResponse.json({
    ok: true,
    status: "approved",
    commitUrl: published.commitUrl,
    cards: cards.ok ? { action: cards.action, commitUrl: cards.commitUrl } : { error: cards.error },
    architecture: "drafting",
  });
}

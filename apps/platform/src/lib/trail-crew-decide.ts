import "server-only";
import { after } from "next/server";
import { getEdit, recordDecision, rejectDuplicates, submitArchitectureDraft, teamLabel } from "./trail-crew-edits";
import {
  publishArchitecture,
  publishCardsForStory,
  publishStoryEdit,
  publishingIsConfigured,
  readRepoFile,
} from "./trail-crew-publish";
import { draftArchitecture } from "./trail-crew-architect";
import { sendTrailCrewArchitectureDraft } from "./email";

/**
 * A teacher's decision on a proposal, whichever door it came through.
 *
 * The signed-in queue and the link in the email both land here. Approving
 * commits the change to the repository, which triggers a rebuild, which
 * regenerates the team's prototype and coach notes.
 *
 * The order matters: commit first, record second. A commit that succeeds while
 * the record fails leaves a proposal that looks pending but is already live,
 * which a teacher can see and re-decide harmlessly. The reverse would mark a
 * change applied that never reached the file, and nobody would ever know.
 *
 * Approving a story fans out. Right behind the story commit, the build card
 * for that story is rewritten from it and committed (no model, by rule).
 * Then, after the response has gone back to the teacher, Spark drafts the
 * architecture change and puts it in this same queue for the teacher to read.
 * The draft is the only part a model writes, and the only part that needs a
 * second approval.
 *
 * Approving an architecture draft commits the whole page.
 */

export interface DecisionOutcome {
  ok: boolean;
  status?: "approved" | "rejected";
  error?: string;
  httpStatus?: number;
  commitUrl?: string;
  cards?: { action?: string; commitUrl?: string; error?: string };
  architecture?: "drafting";
  duplicatesRejected?: number;
}

export async function decideProposal(input: {
  id: string;
  decision: "approve" | "reject";
  editedText?: string;
  decidedBy: string;
}): Promise<DecisionOutcome> {
  const edit = await getEdit(input.id);
  if (!edit) return { ok: false, error: "Proposal not found.", httpStatus: 404 };
  if (edit.status !== "pending") {
    return { ok: false, error: `Already ${edit.status}.`, httpStatus: 409 };
  }

  const { decidedBy } = input;

  if (input.decision === "reject") {
    const done = await recordDecision({ id: input.id, status: "rejected", decidedBy });
    return done
      ? { ok: true, status: "rejected" }
      : { ok: false, error: "Could not record that.", httpStatus: 500 };
  }

  if (!publishingIsConfigured()) {
    return {
      ok: false,
      error: "Approving writes to the repository, and GITHUB_TOKEN is not set on the server.",
      httpStatus: 400,
    };
  }

  const approvedText = (input.editedText ?? "").trim() || edit.proposed_text;

  // --- An architecture draft: the whole page, committed -------------------
  if (edit.kind === "architecture") {
    const published = await publishArchitecture({
      slug: edit.team_slug,
      approvedText,
      storyHeading: edit.story_heading,
      decidedBy,
    });
    if (!published.ok) {
      console.error(`[trail-crew] approve of architecture ${input.id} (${edit.team_slug}) did not commit: ${published.error}`);
      return { ok: false, error: published.error ?? "Could not commit.", httpStatus: 500 };
    }
    await recordDecision({ id: input.id, status: "approved", decidedBy, appliedText: approvedText });
    return { ok: true, status: "approved", commitUrl: published.commitUrl };
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
    // The teacher sees this on the page, but the page is gone by the time
    // anybody asks what went wrong. GitHub's reason belongs in the logs too,
    // and so does which proposal it was, since the row stays pending and
    // cannot say it was ever approved.
    console.error(`[trail-crew] approve of ${input.id} (${edit.team_slug}: ${edit.story_heading}) did not commit: ${published.error}`);
    return { ok: false, error: published.error ?? "Could not commit.", httpStatus: 500 };
  }
  await recordDecision({ id: input.id, status: "approved", decidedBy, appliedText: approvedText });

  // Students double-click. Two identical pending proposals for one story are
  // one proposal, and the second one approved would be refused as "already
  // there" anyway, so it is closed now rather than left for the teacher.
  const duplicatesRejected = await rejectDuplicates({
    id: input.id,
    teamSlug: edit.team_slug,
    storyHeading: edit.story_heading,
    proposedText: edit.proposed_text,
    decidedBy: `${decidedBy} (duplicate of ${input.id})`,
  });

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
      if (stored.ok && stored.id) {
        await sendTrailCrewArchitectureDraft({
          teamLabel: teamLabel(edit.team_slug),
          storyHeading: edit.story_heading,
          reason,
          cardsAction,
          proposalId: stored.id,
        });
      }
    } catch (err) {
      console.error(
        `[trail-crew] architecture draft for ${edit.team_slug} failed:`,
        err instanceof Error ? err.message : "unknown error",
      );
    }
  });

  return {
    ok: true,
    status: "approved",
    commitUrl: published.commitUrl,
    cards: cards.ok ? { action: cards.action, commitUrl: cards.commitUrl } : { error: cards.error },
    architecture: "drafting",
    duplicatesRejected,
  };
}

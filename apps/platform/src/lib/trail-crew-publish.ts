import "server-only";

/**
 * Writes an approved change back to the repository.
 *
 * Approval commits. That choice buys the audit trail for nothing: git already
 * records who changed which story, when, and exactly what it said before, and
 * a teacher can revert a bad call with one click on GitHub. The alternative,
 * making a database the source of truth for the documents, would have meant
 * rebuilding all of that and losing the reviewable diff.
 *
 * The commit triggers a Vercel build, and the build runs the generator, so the
 * team's prototype, test plan and gap guide catch up on their own within a
 * couple of minutes.
 *
 * The build cards catch up too, now, in the same approval: the card for the
 * changed story is rewritten from the story, with no model involved, and
 * committed right behind it. The architecture does not rewrite itself, on
 * purpose: which patterns a feature needs is judgement, so Spark drafts that
 * change into the queue and the teacher approves it separately.
 */

import { parseStories, upsertCardForStory, cardsFromStories, stampCardUpdated, parseBrief } from "@double-blaze/prototype-forge";
import { appendStoryBlock, replaceStoryBlock, stampRevised } from "./trail-crew-story-file";

export { appendStoryBlock, replaceStoryBlock, stampRevised };

const API = "https://api.github.com";

function repoConfig(): { owner: string; repo: string; branch: string; token: string } | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;
  return {
    owner: process.env.TRAIL_CREW_REPO_OWNER?.trim() || "smithjps512",
    repo: process.env.TRAIL_CREW_REPO_NAME?.trim() || "double-blaze",
    branch: process.env.TRAIL_CREW_REPO_BRANCH?.trim() || "main",
    token,
  };
}

export function publishingIsConfigured(): boolean {
  return repoConfig() !== null;
}

/**
 * GitHub's one-line reason for a refusal, for the error the teacher reads.
 * A token that can read a public repo but not write to it fails only on the
 * commit, and "403" alone sends them looking in the wrong place.
 */
async function githubReason(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    const message = body.message?.trim();
    return message ? `: ${message}` : "";
  } catch {
    return "";
  }
}

interface ContentsResponse {
  content: string;
  sha: string;
}

async function gh(path: string, init: RequestInit, token: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** A file from the branch, or `missing` when it is not there yet. */
export async function readRepoFile(
  path: string,
): Promise<{ ok: true; content: string; sha: string } | { ok: true; missing: true } | { ok: false; error: string }> {
  const config = repoConfig();
  if (!config) return { ok: false, error: "Publishing is not configured (no GITHUB_TOKEN)." };
  const read = await gh(
    `/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
    { method: "GET" },
    config.token,
  );
  if (read.status === 404) return { ok: true, missing: true };
  if (!read.ok) return { ok: false, error: `Could not read ${path} (${read.status}${await githubReason(read)}).` };
  const file = (await read.json()) as ContentsResponse;
  return { ok: true, content: Buffer.from(file.content, "base64").toString("utf8"), sha: file.sha };
}

export interface PublishResult {
  ok: boolean;
  error?: string;
  commitUrl?: string;
  /** The file as committed, so a caller can go on working from it. */
  markdown?: string;
}

/** Commit one file. `sha` is the version being replaced; omit it to create. */
export async function writeRepoFile(input: {
  path: string;
  content: string;
  message: string;
  sha?: string;
}): Promise<PublishResult> {
  const config = repoConfig();
  if (!config) return { ok: false, error: "Publishing is not configured (no GITHUB_TOKEN)." };
  const write = await gh(
    `/repos/${config.owner}/${config.repo}/contents/${input.path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: input.message,
        content: Buffer.from(input.content, "utf8").toString("base64"),
        ...(input.sha ? { sha: input.sha } : {}),
        branch: config.branch,
      }),
    },
    config.token,
  );
  if (!write.ok) {
    // A 409 means somebody else changed the file since we read it, which is a
    // real possibility when a teacher approves two edits to one team quickly.
    // Anything else carries GitHub's own reason, which is the only clue the
    // teacher gets: a 403 with "Resource not accessible" is a token without
    // write access to contents, and the page should say so.
    const detail =
      write.status === 409
        ? "the file changed underneath us, try again"
        : `${write.status}${await githubReason(write)}`;
    return { ok: false, error: `Could not commit the change (${detail}).` };
  }
  const body = (await write.json()) as { commit?: { html_url?: string } };
  return { ok: true, commitUrl: body.commit?.html_url, markdown: input.content };
}

export async function publishStoryEdit(input: {
  slug: string;
  storyHeading: string;
  approvedText: string;
  decidedBy: string;
  /** A new story is appended; an edit replaces the block it names. */
  kind?: "edit" | "new";
}): Promise<PublishResult> {
  const path = `docs/students/${input.slug}/user-stories.md`;
  const read = await readRepoFile(path);
  if (!read.ok) return { ok: false, error: read.error };

  // A team's first story from the studio arrives before they have a stories
  // file. Make one, titled like the hand-written ones, and append to it.
  let current: string;
  let sha: string | undefined;
  if ("missing" in read) {
    if (input.kind !== "new") return { ok: false, error: `This team has no ${path} yet.` };
    const planRead = await readRepoFile(`docs/students/${input.slug}/product-plan.md`);
    const brief =
      planRead.ok && !("missing" in planRead) ? parseBrief(planRead.content, input.slug) : { productName: input.slug, teamName: undefined };
    current = `# ${brief.productName} user stories\n\n${brief.teamName ? `Team: ${brief.teamName}\n\n` : ""}`;
  } else {
    current = read.content;
    sha = read.sha;
  }

  const swapped =
    input.kind === "new"
      ? appendStoryBlock(current, input.storyHeading, input.approvedText)
      : replaceStoryBlock(current, input.storyHeading, input.approvedText);
  if (!swapped.ok || !swapped.markdown) {
    return { ok: false, error: swapped.error ?? "Could not place the change in the file." };
  }
  if (swapped.markdown === current) {
    return { ok: false, error: "The approved text is identical to what is already there." };
  }

  return writeRepoFile({
    path,
    content: stampRevised(swapped.markdown),
    message: `${input.kind === "new" ? "Add" : "Update"} "${input.storyHeading}" for ${input.slug}\n\nApproved by ${input.decidedBy} from the Trail Crew queue.`,
    sha,
  });
}

/**
 * Rewrite the changed story's build card from the story, and commit it.
 *
 * Deterministic, the way the prototype is: the card's sentence and finish line
 * are the story's own words, the pattern line is the same guess the test plan
 * makes, and a teacher's note on the card is kept. A team with no cards page
 * gets one, with a card for every story they have.
 */
export async function publishCardsForStory(input: {
  slug: string;
  storyHeading: string;
  storiesMarkdown: string;
  decidedBy: string;
}): Promise<PublishResult & { action?: "replaced" | "appended" | "created"; cardsMarkdown?: string }> {
  const stories = parseStories(input.storiesMarkdown);
  const wanted = input.storyHeading.trim().toLowerCase();
  const story = stories.find((s) => s.featureHint?.trim().toLowerCase() === wanted);
  if (!story) {
    return { ok: false, error: `Could not find the story "${input.storyHeading}" in the committed stories file.` };
  }

  const path = `docs/students/${input.slug}/build-cards.md`;
  const read = await readRepoFile(path);
  if (!read.ok) return { ok: false, error: read.error };

  if ("missing" in read) {
    const planRead = await readRepoFile(`docs/students/${input.slug}/product-plan.md`);
    const brief =
      planRead.ok && !("missing" in planRead) ? parseBrief(planRead.content, input.slug) : { productName: input.slug, teamName: undefined };
    const page = stampCardUpdated(cardsFromStories(stories, { productName: brief.productName, teamName: brief.teamName }));
    const written = await writeRepoFile({
      path,
      content: page,
      message: `Build cards for ${input.slug}, one per story\n\nMade from the stories when "${input.storyHeading}" was approved by ${input.decidedBy}.`,
    });
    return { ...written, action: "created", cardsMarkdown: page };
  }

  const { markdown, action } = upsertCardForStory(read.content, story);
  if (markdown === read.content) return { ok: true, action, cardsMarkdown: markdown };
  const next = stampCardUpdated(markdown);
  const written = await writeRepoFile({
    path,
    content: next,
    message: `${action === "appended" ? "Add" : "Update"} the build card for "${input.storyHeading}" (${input.slug})\n\nRewritten from the story approved by ${input.decidedBy}.`,
    sha: read.sha,
  });
  return { ...written, action, cardsMarkdown: next };
}

/** Commit an approved architecture page, whole. */
export async function publishArchitecture(input: {
  slug: string;
  approvedText: string;
  storyHeading: string;
  decidedBy: string;
}): Promise<PublishResult> {
  const path = `docs/students/${input.slug}/build-architecture.md`;
  const read = await readRepoFile(path);
  if (!read.ok) return { ok: false, error: read.error };
  const content = input.approvedText.replace(/\s+$/, "") + "\n";
  if (!("missing" in read) && read.content === content) {
    return { ok: false, error: "The approved architecture is identical to what is already there." };
  }
  return writeRepoFile({
    path,
    content,
    message: `Architecture for ${input.slug}: ${input.storyHeading}\n\nDrafted by Spark from the approved story, edited and approved by ${input.decidedBy}.`,
    sha: "missing" in read ? undefined : read.sha,
  });
}

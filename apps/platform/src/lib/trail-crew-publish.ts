import "server-only";

/**
 * Writes an approved story change back to the repository.
 *
 * Approval commits. That choice buys the audit trail for nothing: git already
 * records who changed which story, when, and exactly what it said before, and
 * a teacher can revert a bad call with one click on GitHub. The alternative,
 * making a database the source of truth for the documents, would have meant
 * rebuilding all of that and losing the reviewable diff.
 *
 * The commit triggers a Vercel build, and the build runs the generator, so the
 * team's prototype and coach notes catch up on their own within a couple of
 * minutes. The build cards and architecture do not, on purpose: a changed story
 * can change which patterns a feature needs, and that is judgment. They are
 * marked stale instead.
 */

import { replaceStoryBlock, stampRevised } from "./trail-crew-story-file";

export { replaceStoryBlock, stampRevised };

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

export interface PublishResult {
  ok: boolean;
  error?: string;
  commitUrl?: string;
}

export async function publishStoryEdit(input: {
  slug: string;
  storyHeading: string;
  approvedText: string;
  decidedBy: string;
}): Promise<PublishResult> {
  const config = repoConfig();
  if (!config) return { ok: false, error: "Publishing is not configured (no GITHUB_TOKEN)." };

  const path = `docs/students/${input.slug}/user-stories.md`;
  const url = `/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;

  const read = await gh(url, { method: "GET" }, config.token);
  if (!read.ok) {
    return { ok: false, error: `Could not read ${path} (${read.status}).` };
  }
  const file = (await read.json()) as ContentsResponse;
  const current = Buffer.from(file.content, "base64").toString("utf8");

  const swapped = replaceStoryBlock(current, input.storyHeading, input.approvedText);
  if (!swapped.ok || !swapped.markdown) {
    return { ok: false, error: swapped.error ?? "Could not place the change in the file." };
  }
  if (swapped.markdown === current) {
    return { ok: false, error: "The approved text is identical to what is already there." };
  }

  const next = stampRevised(swapped.markdown);
  const write = await gh(
    `/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Update "${input.storyHeading}" for ${input.slug}\n\nApproved by ${input.decidedBy} from the Trail Crew queue.`,
        content: Buffer.from(next, "utf8").toString("base64"),
        sha: file.sha,
        branch: config.branch,
      }),
    },
    config.token,
  );

  if (!write.ok) {
    // A 409 means somebody else changed the file since we read it, which is a
    // real possibility when a teacher approves two edits to one team quickly.
    const detail = write.status === 409 ? "the file changed underneath us, try again" : `${write.status}`;
    return { ok: false, error: `Could not commit the change (${detail}).` };
  }

  const body = (await write.json()) as { commit?: { html_url?: string } };
  return { ok: true, commitUrl: body.commit?.html_url };
}

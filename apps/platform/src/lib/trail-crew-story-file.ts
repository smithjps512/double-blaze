/**
 * Rewriting a team's user stories file.
 *
 * Pure, and separate from `trail-crew-publish.ts` because that module is
 * server-only and cannot be imported by the test runner. These two functions
 * edit documents that thirteen year olds wrote by hand, so they are the last
 * thing in this feature that should go untested.
 */

/**
 * Swap one story's block for the approved text.
 *
 * A story owns everything from its own `##` heading until the next one, which
 * is the same rule the students are taught and the same rule the parser uses.
 * Exported so it can be tested without touching GitHub, because getting this
 * wrong would corrupt a team's document.
 */
export function replaceStoryBlock(
  markdown: string,
  heading: string,
  replacement: string,
): { ok: boolean; markdown?: string; error?: string } {
  const lines = markdown.split(/\r?\n/);
  const wanted = heading.trim().toLowerCase();

  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^##\s+(.*)$/);
    if (m && m[1].trim().toLowerCase() === wanted) {
      start = i;
      break;
    }
  }
  if (start === -1) return { ok: false, error: `No story headed "${heading}" in this file.` };

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const block = `## ${heading.trim()}\n\n${replacement.trim()}\n`;
  const next = [...lines.slice(0, start), ...block.split("\n"), ...lines.slice(end)];
  return { ok: true, markdown: next.join("\n").replace(/\n{4,}/g, "\n\n\n") };
}

/**
 * Stamp the file with when it was last revised.
 *
 * The build cards compare this against their own "Card updated" line to know
 * whether they have fallen behind. A date in the document beats a file
 * timestamp, which no git checkout preserves, and a human can read it.
 */
export function stampRevised(markdown: string, when = new Date()): string {
  const date = when.toISOString().slice(0, 10);
  if (/^Revised:\s*\S+/m.test(markdown)) {
    return markdown.replace(/^Revised:\s*\S+.*$/m, `Revised: ${date}`);
  }
  // After the Team line when there is one, otherwise after the title.
  if (/^Team:\s*.+$/m.test(markdown)) {
    return markdown.replace(/^(Team:\s*.+)$/m, `$1\n\nRevised: ${date}`);
  }
  return markdown.replace(/^(#\s+.*)$/m, `$1\n\nRevised: ${date}`);
}

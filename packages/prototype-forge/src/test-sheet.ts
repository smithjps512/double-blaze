/**
 * A user test sheet for one team's app, made from their build cards.
 *
 * The generic sheet (a Word document under /build/) works for any app and
 * asks the tester to pick five cards. This one is the same sheet with the
 * cards already on it: every card's story and its Done when list, each line a
 * box to tick, so a tester checks the team's own promises rather than
 * inventing tests. It is Markdown, rendered like every other page in the
 * chain, and it prints: the boxes are the same ☐ the Word sheet uses.
 *
 * Deterministic on purpose, like the test plan and the cards. Nothing here is
 * judgement; the sheet is exactly as good as the cards it was made from,
 * which is the point of showing it to the team.
 */

import type { BuildCard } from "./cards";

export interface TestSheetMeta {
  productName: string;
  teamName?: string;
  /** Where the app under test is, when the team has a demo. */
  demoHref?: string;
  /** The generic Word sheet, for a tester who prefers paper. */
  docxHref?: string;
}

const BREAK_IT = [
  "Leave a box empty and press the button anyway.",
  "Type letters where a number should go (a price, a score, a distance).",
  "Press the same button twice, fast.",
  "Refresh the page in the middle of doing something. Is your stuff still there?",
  "Turn the phone sideways, or make the window very narrow.",
  "Search for something that does not exist.",
];

const RATINGS = [
  "I could work out what to do without being told.",
  "The app does what the team's build cards say it does.",
  "It looks like it belongs to this team (their plan, their design).",
  "I would use this if it were real.",
  "You can tell the team put effort into this.",
];

const line = (n = 40) => "_".repeat(n);

export function renderTestSheet(cards: BuildCard[], meta: TestSheetMeta): string {
  const out: string[] = [];
  out.push(`# ${meta.productName}: user test sheet`);
  out.push("");
  if (meta.teamName) out.push(`Team: ${meta.teamName}.`);
  out.push("");
  out.push(
    "Test this app the way a real user would, write down what happened, and turn this in. You are testing the app, not the person. Pass means it did exactly what the Done when line says; nearly is a Fail with a note about what was different.",
  );
  out.push("");
  if (meta.demoHref) out.push(`**The app:** [${meta.demoHref}](${meta.demoHref}). Open it on a phone if you can.`);
  if (meta.docxHref) out.push(`**Prefer paper?** [The blank sheet as a Word document](${meta.docxHref}) works for any app.`);
  out.push("");
  out.push("| Tester | Write here |");
  out.push("|---|---|");
  out.push(`| Your name (initials are fine) | ${line(28)} |`);
  out.push(`| Date | ${line(28)} |`);
  out.push(`| Your team | ${line(28)} |`);
  out.push(`| Device (phone, Chromebook, other) | ${line(28)} |`);
  out.push("");

  out.push("## Part 1: The cards");
  out.push("");
  out.push(
    cards.length
      ? `This app has ${cards.length} ${cards.length === 1 ? "card" : "cards"}. Each one is a promise the team wrote. Do what the story says, then tick every Done when line that came true. Leave a line unticked if it did not, and say what happened instead.`
      : "This team has no build cards yet, so there is nothing to test against. Ask them for their stories.",
  );
  out.push("");
  for (const card of cards) {
    out.push(`### ${card.heading}`);
    out.push("");
    if (card.story) {
      out.push(`**The story.** ${card.story}`);
      out.push("");
    }
    out.push("**Done when:**");
    out.push("");
    if (card.criteria.length) {
      for (const c of card.criteria) out.push(`- ☐ ${c}`);
    } else {
      out.push("- ☐ This card has no Done when lines. That is a finding: write it in Part 3.");
    }
    out.push("");
    out.push(`**What actually happened:** ${line(44)}`);
    out.push("");
    out.push(`${line(60)}`);
    out.push("");
    out.push("**This card:** ☐ Pass &nbsp;&nbsp; ☐ Fail");
    out.push("");
  }

  out.push("## Part 2: Try to break it");
  out.push("");
  out.push("A real app is tested by people who are not careful. Be one of them, on purpose.");
  out.push("");
  out.push("| Try this | What happened | Handled well? |");
  out.push("|---|---|---|");
  for (const b of BREAK_IT) out.push(`| ${b} | ${line(20)} | ☐ Yes ☐ No |`);
  out.push("");

  out.push("## Part 3: Bugs you found");
  out.push("");
  out.push(
    "Anything that did not work, looked wrong, or confused you. One row per bug. Steps matter more than opinions: a bug the team can make happen again is a bug they can fix. How bad: 1 small, 2 annoying, 3 cannot continue.",
  );
  out.push("");
  out.push("| # | What went wrong | How to make it happen again | How bad | Which card |");
  out.push("|---|---|---|---|---|");
  for (let i = 1; i <= 4; i += 1) out.push(`| ${i} | ${line(18)} | ${line(18)} | ☐ 1 ☐ 2 ☐ 3 | ${line(6)} |`);
  out.push("");

  out.push("## Part 4: Your ratings");
  out.push("");
  out.push("| Statement | 1 No | 2 | 3 | 4 | 5 Yes |");
  out.push("|---|---|---|---|---|---|");
  for (const r of RATINGS) out.push(`| ${r} | ☐ | ☐ | ☐ | ☐ | ☐ |`);
  out.push("");

  out.push("## Part 5: In your own words");
  out.push("");
  out.push("**Two things the team should keep exactly as they are:**");
  out.push("");
  out.push(`1. ${line(50)}`);
  out.push(`2. ${line(50)}`);
  out.push("");
  out.push("**Two things the team should change:**");
  out.push("");
  out.push(`1. ${line(50)}`);
  out.push(`2. ${line(50)}`);
  out.push("");
  out.push("**One story that is missing.** Something you wanted to do and could not, written as a user story:");
  out.push("");
  out.push(`As a ${line(16)}, I want ${line(28)}, so that ${line(28)}.`);
  out.push("");
  out.push(`Tester signature: ${line(24)} &nbsp;&nbsp; Date: ${line(10)}`);
  out.push("");

  out.push("## Team response");
  out.push("");
  out.push("For the team whose app was tested. Fill this in after you read the sheet, and turn both in together.");
  out.push("");
  out.push("| Bug # | What we will do about it | Who | Done (date) |");
  out.push("|---|---|---|---|");
  for (let i = 0; i < 4; i += 1) out.push(`| ${line(3)} | ${line(24)} | ${line(8)} | ${line(8)} |`);
  out.push("");
  out.push(`**The most useful thing this tester told us:** ${line(40)}`);
  out.push("");
  return out.join("\n");
}

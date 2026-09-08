/**
 * Builds a clickable prototype for every student team in `docs/students`.
 *
 * The generator itself is `@double-blaze/prototype-forge`, which is pure. This
 * script is the only part that touches disk: it reads each team folder, writes
 * a self-contained HTML file into `public/prototypes`, and writes the manifest
 * the gallery page reads.
 *
 * Output is committed rather than generated at deploy time, on purpose. The
 * gallery has to be reviewable before a class sees it, and a diff of the HTML
 * is the only honest review of what a team's documents produced.
 *
 *   npm run prototypes                    every team
 *   npm run prototypes -- sample-bus-buddy  one team
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  forgePrototype,
  renderDocPage,
  parseArchitecture,
  renderDesignBrief,
  parseStories,
  planFromStory,
  renderTestPlan,
  patternsFromStory,
  type DocLink,
} from "@double-blaze/prototype-forge";

const here = dirname(fileURLToPath(import.meta.url));
const platformRoot = resolve(here, "..");
const repoRoot = resolve(platformRoot, "../..");
const studentsDir = join(repoRoot, "docs/students");
const outputDir = join(platformRoot, "public/prototypes");
const manifestPath = join(platformRoot, "src/data/prototype-gallery.json");
const contextPath = join(platformRoot, "src/data/build-context.json");
const buildDocsDir = join(repoRoot, "docs/build");
const sharedOutDir = join(platformRoot, "public/build");

export interface GalleryEntry {
  slug: string;
  productName: string;
  teamName?: string;
  purpose: string;
  features: string[];
  href: string;
  stats: { features: number; stories: number; scenarios: number; screens: number };
  /** Open coach notes, so a teacher can see at a glance who needs a nudge. */
  gaps: number;
  /** Whether this team has build documents yet. */
  buildHref?: string;
  /** The designers' page, generated from the architecture. */
  designHref?: string;
  /** The test plan, derived from the stories. Needs no build documents. */
  testPlanHref?: string;
}

async function readIfPresent(path: string): Promise<string | undefined> {
  return existsSync(path) ? readFile(path, "utf8") : undefined;
}

interface CodeGuidePage {
  /** Filename without the extension, which becomes part of the page's href. */
  name: string;
  title: string;
  markdown: string;
}

/**
 * A team's project code guide, if their folder has one.
 *
 * Pages are rendered flat into the team's directory rather than a subfolder so
 * that every relative link in the shared chain nav still resolves. README goes
 * first because it carries the rule about comparing rather than pasting, which
 * is the only reason handing a team finished code is defensible at all.
 */
async function readCodeGuide(dir: string): Promise<CodeGuidePage[]> {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const ordered = [
    ...files.filter((f) => f.toLowerCase().startsWith("readme")),
    ...files.filter((f) => !f.toLowerCase().startsWith("readme")),
  ];

  const pages = await Promise.all(
    ordered.map(async (file) => {
      const markdown = await readFile(join(dir, file), "utf8");
      return {
        name: file.replace(/\.md$/, ""),
        title: markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? file,
        markdown,
      };
    }),
  );

  // Every page carries the whole contents list, because a student who lands on
  // one of these from a search has no other way to reach the rest.
  return pages.map((page) => ({
    ...page,
    markdown: `${page.markdown}\n\n---\n\n## The rest of this guide\n\n${pages
      .map((other) =>
        other.name === page.name
          ? `- **${other.title}** (you are here)`
          : `- [${other.title}](code-guide-${other.name}.html)`,
      )
      .join("\n")}\n`,
  }));
}

/** The plan may be named a few ways. Take the first one that exists. */
const PLAN_NAMES = ["product-plan.md", "product-brief.md", "plan.md", "brief.md"];
const STORY_NAMES = ["user-stories.md", "stories.md", "user-stories.markdown"];

/**
 * Split a stories file into its `##` blocks.
 *
 * The same rule the parser and the publisher use: a story owns everything from
 * its heading to the next one. Three places now depend on that rule holding, so
 * it is worth stating each time rather than assuming.
 */
function splitStories(markdown: string): Array<{ heading: string; text: string }> {
  const lines = markdown.split(/\r?\n/);
  const out: Array<{ heading: string; text: string }> = [];
  let heading: string | null = null;
  let body: string[] = [];

  const flush = () => {
    if (heading) out.push({ heading, text: body.join("\n").trim() });
    body = [];
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      flush();
      heading = m[1].trim();
      continue;
    }
    if (heading) body.push(line);
  }
  flush();
  return out.filter((s) => s.text.length > 0);
}

/**
 * A team's test plan, derived from the stories they already wrote.
 *
 * Generated rather than written, for the same reason the prototype is: a plan
 * a model wrote would read well whatever the story said, and the point here is
 * that a vague acceptance criterion produces a visibly useless test. The teams'
 * existing stories are the worked examples, and some of them are excellent
 * examples precisely because they contain criteria nobody could ever check.
 */
function testPlanDocument(storiesMarkdown: string, subtitle: string): string | undefined {
  const stories = parseStories(storiesMarkdown);
  if (stories.length === 0) return undefined;

  const out: string[] = [];
  out.push(`# Test plan: ${subtitle}`);
  out.push("");
  out.push(
    "Nobody wrote this page. It was worked out from your own user stories by following three rules, and you could follow the same three rules on paper.",
  );
  out.push("");
  out.push("1. **Every Given/When/Then scenario is already a test.** Given is the setup, When is what somebody does, Then is what should happen. Nothing to invent.");
  out.push("2. **Every acceptance criterion becomes a test** that checks it. It gives you what has to be true, and leaves you to work out what you would do.");
  out.push("3. **Every rule that refuses something gets a second test** that tries to do the refused thing, because a rule you have not broken on purpose is a rule you do not know works.");
  out.push("");
  out.push("And one refusal: a criterion nobody could check by looking at the app does not get a test. It gets a note saying so, because a made up test for it would be worse than nothing.");
  out.push("");

  let total = 0;
  let blanks = 0;
  let untestable = 0;
  const body: string[] = [];

  for (const story of stories) {
    const plan = planFromStory(story);
    total += plan.cases.length;
    blanks += plan.cases.filter((c) => c.steps === null).length;
    untestable += plan.untestable.length;
    body.push(renderTestPlan(plan));

    const patterns = patternsFromStory(story);
    if (patterns.length > 0) {
      body.push(
        `**Code directions, first draft.** From the words in your own criteria, this one probably needs ${patterns
          .map((h) => `Pattern ${h.pattern}`)
          .join(", ")}. That is a guess, not a verdict: read them, decide the order yourselves, and put the order on your architecture page.`,
      );
      body.push("");
    }
    body.push("---");
    body.push("");
  }

  out.push("## Where this team stands");
  out.push("");
  out.push(`| | |`);
  out.push(`|---|---|`);
  out.push(`| Stories | ${stories.length} |`);
  out.push(`| Tests this produced | ${total} |`);
  out.push(`| Tests missing their steps | ${blanks} |`);
  out.push(`| Criteria with no test at all | ${untestable} |`);
  out.push("");
  if (untestable > 0) {
    out.push(
      `Those ${untestable === 1 ? "criterion is" : `${untestable} criteria are`} the most useful ${untestable === 1 ? "line" : "lines"} on this page. ${untestable === 1 ? "It is" : "They are"} not wrong to want, and ${untestable === 1 ? "it is" : "they are"} not something anybody can check. Rewriting ${untestable === 1 ? "it" : "them"} is twenty minutes that saves an argument later about whether the feature is done.`,
    );
    out.push("");
  }
  out.push("---");
  out.push("");
  out.push(...body);
  return out.join("\n");
}

async function firstPresent(dir: string, names: string[]): Promise<string | undefined> {
  for (const name of names) {
    const found = await readIfPresent(join(dir, name));
    if (found !== undefined) return found;
  }
  return undefined;
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));

  if (!existsSync(studentsDir)) {
    console.error(`No student folder at ${studentsDir}.`);
    process.exitCode = 1;
    return;
  }

  const entries = await readdir(studentsDir, { withFileTypes: true });
  const teams = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .map((e) => e.name)
    .filter((name) => only.length === 0 || only.includes(name))
    .sort();

  if (teams.length === 0) {
    console.error(only.length > 0 ? `No team folder matched: ${only.join(", ")}` : "No team folders found.");
    process.exitCode = 1;
    return;
  }

  // A full run owns the output folder, so a deleted team stops being published.
  // A single team run touches only that team.
  if (only.length === 0 && existsSync(outputDir)) {
    await rm(outputDir, { recursive: true, force: true });
  }
  await mkdir(outputDir, { recursive: true });

  // The two shared pages sit outside the per-team folder so a single team run
  // does not have to rebuild them and a full run does not wipe them.
  await mkdir(sharedOutDir, { recursive: true });
  const sharedTheme = {
    primary: "#630031", accent: "#cf4420", surface: "#fdfbf8", text: "#1c1a19",
    muted: "#75787b", headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
  };
  const sharedLinks = (current: string): DocLink[] => [
    { label: "How to build your app", href: "/build/instructions.html", current: current === "instructions" },
    { label: "Writing a story", href: "/build/writing-a-story.html", current: current === "writing-a-story" },
    { label: "Videos", href: "/build/watch-list.html", current: current === "watch-list" },
    { label: "First steps in Anvil", href: "/build/first-steps.html", current: current === "first-steps" },
    { label: "Pattern Book", href: "/build/patterns.html", current: current === "patterns" },
    { label: "Red text", href: "/build/errors.html", current: current === "errors" },
    { label: "Designing for Anvil", href: "/build/figma.html", current: current === "figma" },
    { label: "Figma step by step", href: "/build/prototype-steps.html", current: current === "prototype-steps" },
    { label: "All teams", href: "/trail-crew" },
  ];
  const instructions = await readIfPresent(join(buildDocsDir, "how-to-use-these.md"));
  if (instructions !== undefined) {
    await writeFile(
      join(sharedOutDir, "instructions.html"),
      renderDocPage({
        title: "How to build your app",
        subtitle: "Read this once, then keep it open",
        markdown: instructions,
        theme: sharedTheme,
        links: sharedLinks("instructions"),
      }),
      "utf8",
    );
  }
  const firstSteps = await readIfPresent(join(buildDocsDir, "anvil-first-steps.md"));
  if (firstSteps !== undefined) {
    await writeFile(
      join(sharedOutDir, "first-steps.html"),
      renderDocPage({
        title: "First steps in Anvil",
        subtitle: "Where to type it, and what to click",
        markdown: firstSteps,
        theme: sharedTheme,
        links: sharedLinks("first-steps"),
      }),
      "utf8",
    );
  }
  const errors = await readIfPresent(join(buildDocsDir, "anvil-errors.md"));
  if (errors !== undefined) {
    await writeFile(
      join(sharedOutDir, "errors.html"),
      renderDocPage({
        title: "When Anvil shows you red text",
        subtitle: "Find your error. It is not you failing.",
        markdown: errors,
        theme: sharedTheme,
        links: sharedLinks("errors"),
      }),
      "utf8",
    );
  }
  const patterns = await readIfPresent(join(buildDocsDir, "anvil-patterns.md"));
  if (patterns !== undefined) {
    await writeFile(
      join(sharedOutDir, "patterns.html"),
      renderDocPage({
        title: "The Anvil Pattern Book",
        subtitle: "The code. Shared by every team.",
        markdown: patterns,
        theme: sharedTheme,
        links: sharedLinks("patterns"),
      }),
      "utf8",
    );
  }
  const watchList = await readIfPresent(join(buildDocsDir, "watch-list.md"));
  if (watchList !== undefined) {
    await writeFile(
      join(sharedOutDir, "watch-list.html"),
      renderDocPage({
        title: "Things to watch",
        subtitle: "Short videos, for when reading is not landing",
        markdown: watchList,
        theme: sharedTheme,
        links: sharedLinks("watch-list"),
      }),
      "utf8",
    );
  }
  const writingAStory = await readIfPresent(join(buildDocsDir, "writing-a-story.md"));
  if (writingAStory !== undefined) {
    await writeFile(
      join(sharedOutDir, "writing-a-story.html"),
      renderDocPage({
        title: "Writing a user story",
        subtitle: "And everything that falls out of one",
        markdown: writingAStory,
        theme: sharedTheme,
        links: sharedLinks("writing-a-story"),
      }),
      "utf8",
    );
  }
  const prototypeSteps = await readIfPresent(join(buildDocsDir, "figma-prototype-steps.md"));
  if (prototypeSteps !== undefined) {
    await writeFile(
      join(sharedOutDir, "prototype-steps.html"),
      renderDocPage({
        title: "Make a clickable prototype in Figma",
        subtitle: "Step by step. Nothing skipped.",
        markdown: prototypeSteps,
        theme: sharedTheme,
        links: sharedLinks("prototype-steps"),
      }),
      "utf8",
    );
  }
  const figma = await readIfPresent(join(buildDocsDir, "figma-for-anvil.md"));
  if (figma !== undefined) {
    await writeFile(
      join(sharedOutDir, "figma.html"),
      renderDocPage({
        title: "Designing for Anvil",
        subtitle: "For the designers. Not a Figma tutorial.",
        markdown: figma,
        theme: sharedTheme,
        links: sharedLinks("figma"),
      }),
      "utf8",
    );
  }

  // The helper needs the build documents at request time, and a Vercel function
  // cannot read docs/. Emitting them as data the route imports keeps the
  // documents the single source of truth: edit the markdown, run this, and the
  // helper is reading the same page the student is.
  const buildContext: {
    patterns?: string;
    instructions?: string;
    firstSteps?: string;
    errors?: string;
    figma?: string;
    prototypeSteps?: string;
    writingAStory?: string;
    teams: Record<
      string,
      {
        productName: string;
        teamName?: string;
        cards?: string;
        architecture?: string;
        designBrief?: string;
        dataTables?: string;
        codeGuide?: string[];
        stories?: string;
      }
    >;
  } = { patterns, instructions, firstSteps, errors, figma, prototypeSteps, writingAStory, teams: {} };

  const manifest: GalleryEntry[] = [];
  const previous: GalleryEntry[] =
    only.length > 0 && existsSync(manifestPath)
      ? JSON.parse(await readFile(manifestPath, "utf8"))
      : [];

  for (const slug of teams) {
    const dir = join(studentsDir, slug);
    const planMarkdown = await firstPresent(dir, PLAN_NAMES);
    if (planMarkdown === undefined) {
      console.warn(`  skipped ${slug}: no ${PLAN_NAMES[0]}`);
      continue;
    }
    const storiesMarkdown = await firstPresent(dir, STORY_NAMES);

    const { brief, stories, app, html } = forgePrototype({
      planMarkdown,
      storiesMarkdown,
      fallbackName: slug,
    });

    await mkdir(join(outputDir, slug), { recursive: true });
    await writeFile(join(outputDir, slug, "index.html"), html, "utf8");

    // The test plan needs only stories, so a team gets one before they have any
    // build documents. It is often the page that shows them why their stories
    // are not ready to build from yet.
    const subtitle = `${brief.productName}${brief.teamName ? ` by ${brief.teamName}` : ""}`;
    const testPlan = storiesMarkdown ? testPlanDocument(storiesMarkdown, subtitle) : undefined;
    let testPlanHref: string | undefined;

    // Build documents are optional: a team gets them once their slice has been
    // worked out with the teacher, so a missing pair is a normal state.
    const cards = await readIfPresent(join(dir, "build-cards.md"));
    const architecture = await readIfPresent(join(dir, "build-architecture.md"));
    // A team whose tables need explaining gets a setup sheet. Most do not: the
    // shape of two columns is obvious and a page about it would be noise.
    const dataTables = await readIfPresent(join(dir, "data-tables.md"));
    // A team can be given the whole app written out, blanks filled in, when
    // looking names up has stopped being the thing slowing them down. That is a
    // teacher's call per team, so it is a folder that exists or does not.
    const codeGuide = await readCodeGuide(join(dir, "project-code-guide"));
    let buildHref: string | undefined;
    let designHref: string | undefined;

    // Every link the chain can hold, each one only when the page it points at
    // is going to exist. A team gets a shorter chain early on and it grows as
    // they write more, rather than offering them links into nothing.
    const chain = (current: string): DocLink[] => [
      ...(testPlan !== undefined
        ? [{ label: "Test plan", href: "test-plan.html", current: current === "test-plan" }]
        : []),
      ...(cards !== undefined
        ? [{ label: "1. Build cards", href: "cards.html", current: current === "cards" }]
        : []),
      ...(architecture !== undefined
        ? [
            { label: "2. Architecture", href: "architecture.html", current: current === "architecture" },
            ...(dataTables !== undefined
              ? [
                  {
                    label: "Data tables",
                    href: "data-tables.html",
                    current: current === "data-tables",
                  },
                ]
              : []),
            { label: "3. Pattern Book", href: "/build/patterns.html" },
            ...(codeGuide.length > 0
              ? [
                  {
                    label: "Code guide",
                    href: `code-guide-${codeGuide[0].name}.html`,
                    current: current === "code-guide",
                  },
                ]
              : []),
            { label: "Design brief", href: "design.html", current: current === "design" },
            { label: "Designing for Anvil", href: "/build/figma.html" },
            { label: "Figma step by step", href: "/build/prototype-steps.html" },
            { label: "First steps", href: "/build/first-steps.html" },
            { label: "Red text", href: "/build/errors.html" },
          ]
        : [{ label: "Writing a story", href: "/build/writing-a-story.html" }]),
      { label: "Prototype", href: "index.html" },
    ];

    // Split the stories into blocks so a team can propose a change to one of
    // them, and work out whether the build guide has fallen behind them.
    const storyBlocks = splitStories(storiesMarkdown ?? "");
    const revised = (storiesMarkdown ?? "").match(/^Revised:\s*(\S+)/m)?.[1];
    const cardUpdated = (cards ?? "").match(/^Card updated:\s*(\S+)/m)?.[1];
    const staleSince = revised && (!cardUpdated || cardUpdated < revised) ? revised : undefined;

    // Every team is in the helper's context, with or without build documents:
    // the story coach only needs their stories, and a team with none is exactly
    // the team most likely to open it.
    buildContext.teams[slug] = {
      productName: brief.productName,
      teamName: brief.teamName,
      stories: storiesMarkdown,
    };

    if (testPlan !== undefined) {
      await writeFile(
        join(outputDir, slug, "test-plan.html"),
        renderDocPage({
          title: "Test plan",
          subtitle,
          markdown: testPlan,
          theme: app.theme,
          links: chain("test-plan"),
          askForTeam: slug,
          staleSince,
        }),
        "utf8",
      );
      testPlanHref = `/prototypes/${slug}/test-plan.html`;
    }

    if (cards !== undefined || architecture !== undefined) {
      // The design brief is generated from the architecture rather than written,
      // so a design brief and the thing being built cannot drift apart. There is
      // no second document for anyone to keep in sync.
      const designBrief =
        architecture !== undefined
          ? renderDesignBrief(parseArchitecture(architecture), {
              productName: brief.productName,
              teamName: brief.teamName,
              figmaHref: "/build/figma.html",
            })
          : undefined;

      buildContext.teams[slug].cards = cards;
      buildContext.teams[slug].architecture = architecture;
      buildContext.teams[slug].designBrief = designBrief;
      buildContext.teams[slug].dataTables = dataTables;
      // The helper gets the guide's contents list, not its code. It can then
      // say "that is on page 5" without holding a finished answer to recite,
      // which is the same job it does for every other page in the chain.
      buildContext.teams[slug].codeGuide = codeGuide.map((page) => page.title);
      if (cards !== undefined) {
        await writeFile(
          join(outputDir, slug, "cards.html"),
          renderDocPage({
            title: "Build cards",
            subtitle,
            markdown: cards,
            theme: app.theme,
            links: chain("cards"),
            askForTeam: slug,
            proposeStories: storyBlocks,
            staleSince,
          }),
          "utf8",
        );
        buildHref = `/prototypes/${slug}/cards.html`;
      }
      if (architecture !== undefined) {
        await writeFile(
          join(outputDir, slug, "architecture.html"),
          renderDocPage({
            title: "Build architecture",
            subtitle,
            markdown: architecture,
            theme: app.theme,
            links: chain("architecture"),
            askForTeam: slug,
            staleSince,
          }),
          "utf8",
        );
        buildHref = buildHref ?? `/prototypes/${slug}/architecture.html`;
      }
      for (const page of codeGuide) {
        await writeFile(
          join(outputDir, slug, `code-guide-${page.name}.html`),
          renderDocPage({
            title: page.title,
            subtitle,
            markdown: page.markdown,
            theme: app.theme,
            links: chain("code-guide"),
            askForTeam: slug,
            staleSince,
          }),
          "utf8",
        );
      }
      if (dataTables !== undefined) {
        await writeFile(
          join(outputDir, slug, "data-tables.html"),
          renderDocPage({
            title: "Setting up the data tables",
            subtitle,
            markdown: dataTables,
            theme: app.theme,
            links: chain("data-tables"),
            askForTeam: slug,
            staleSince,
          }),
          "utf8",
        );
      }
      if (designBrief !== undefined) {
        await writeFile(
          join(outputDir, slug, "design.html"),
          renderDocPage({
            title: "Design brief",
            subtitle,
            markdown: designBrief,
            theme: app.theme,
            links: chain("design"),
            askForTeam: slug,
            askKind: "design",
            staleSince,
          }),
          "utf8",
        );
        designHref = `/prototypes/${slug}/design.html`;
      }
    }

    const gaps = app.notes.filter((n) => n.level === "gap").length;
    manifest.push({
      slug,
      productName: brief.productName,
      teamName: brief.teamName,
      purpose: brief.purpose || brief.description,
      features: brief.features.map((f) => f.name),
      href: `/prototypes/${slug}/index.html`,
      stats: app.stats,
      gaps,
      buildHref,
      designHref,
      testPlanHref,
    });

    console.log(
      `  ${slug}: ${brief.features.length} features, ${stories.length} stories, ` +
        `${app.stats.screens} screens, ${gaps} open notes${buildHref ? ", build guide" : ""}`,
    );
  }

  const merged = only.length > 0 ? mergeManifest(previous, manifest) : manifest;
  merged.sort((a, b) => a.productName.localeCompare(b.productName));
  await writeFile(manifestPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  // A single-team run must not drop the other teams from the helper's context.
  const previousContext =
    only.length > 0 && existsSync(contextPath)
      ? JSON.parse(await readFile(contextPath, "utf8"))
      : { teams: {} };
  buildContext.teams = { ...previousContext.teams, ...buildContext.teams };
  await writeFile(contextPath, `${JSON.stringify(buildContext, null, 2)}\n`, "utf8");

  console.log(`\nWrote ${manifest.length} prototype(s) to ${outputDir}`);
  console.log(`Gallery manifest: ${manifestPath}`);
}

function mergeManifest(previous: GalleryEntry[], next: GalleryEntry[]): GalleryEntry[] {
  const bySlug = new Map(previous.map((e) => [e.slug, e]));
  for (const entry of next) bySlug.set(entry.slug, entry);
  return [...bySlug.values()];
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

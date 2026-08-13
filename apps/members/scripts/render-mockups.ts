/**
 * Render the member area's proposed look to one self-contained HTML file.
 *
 *   npx tsx apps/members/scripts/render-mockups.ts
 *
 * A design gate artifact, the same idea as apps/platform/scripts/render-preview.ts
 * which is how session 2's marketing page was reviewed. The point is that a
 * wrong direction gets found in a file rather than after a session of wiring it
 * into pages.
 *
 * ---------------------------------------------------------------------------
 * What this is and is not
 * ---------------------------------------------------------------------------
 *
 * It is static HTML. Nothing here queries anything, nothing is interactive, and
 * the content is the seeded demonstration content so the pages look like a club
 * rather than like lorem ipsum.
 *
 * **It inlines the real globals.css and the real theme tokens.** That is the
 * point of it after the first review: the markup below uses the same class
 * names the components emit, so running this and looking at the result is a
 * check on the stylesheet that ships rather than on a copy of it that can
 * drift. It caught two things the first time: shelf pills whose styling was
 * keyed to a class the markup never had, and a lead article treatment that
 * existed in the design and in no component.
 *
 * The colours come from ELECTRIC_GRID_THEME through the same resolveTheme and
 * themeCss the layout uses, so what is reviewed is provably what a member
 * sees.
 *
 * ---------------------------------------------------------------------------
 * The one thing that differs from what ships
 * ---------------------------------------------------------------------------
 *
 * This file pulls Source Serif 4 and Inter from Google Fonts, because a single
 * file opened from disk has no other way to show the intended typography.
 * Neither half of the product loads a webfont today, so both currently fall
 * back to Georgia and system-ui.
 *
 * If the type here is worth having, the implementation self-hosts it through
 * next/font so nothing is fetched from a third party at runtime, and the
 * marketing page should get the same treatment so the two halves match. If the
 * link fails, everything below falls back to Georgia and still reads properly,
 * which is deliberate: the design should not depend on a font arriving.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ELECTRIC_GRID_THEME } from "../../platform/src/lib/clients/electric-grid";
import { ARTICLE_COPY, ARTICLE_KIND_OPTIONS } from "../src/lib/articles";
import { resolveTheme, themeCss } from "../src/lib/theme";

const CLUB = "AI Interest for Electric Grid";
const { colors } = ELECTRIC_GRID_THEME;

/* ---------------------------------------------------------------------------
 * Content
 *
 * Mirrors supabase/seed/electric_grid_demo.sql. Duplicated rather than queried
 * so this script runs anywhere with no credentials. It is a preview artifact,
 * not a source of truth, and the seed remains the source of truth.
 * ------------------------------------------------------------------------- */

interface Person {
  name: string;
  title: string;
  employer: string;
  location: string;
  career?: string;
  interests?: string;
}

const PEOPLE: Record<string, Person> = {
  dana: {
    name: "Dana Okafor",
    title: "Director of Transmission Planning",
    employer: "Cascade Power Authority",
    location: "Portland, United States",
    career:
      "Twenty years in transmission planning, most of it on interconnection studies and the long range plan. I came up through the study group and still do my own load flow work when nobody is watching.\n\nWhat I care about is the gap between what a model says and what the people reading it think it says.",
    interests:
      "Forecast assumptions, interconnection study methods, and how planning teams actually make decisions when the model is ambiguous.",
  },
  tomas: {
    name: "Tomas Lindqvist",
    title: "Head of Load Forecasting",
    employer: "Ravensbourne Electric Cooperative",
    location: "Malmo, Sweden",
  },
  priya: {
    name: "Priya Raghunathan",
    title: "Principal Engineer",
    employer: "Meridian Grid Services",
    location: "Bengaluru, India",
  },
  aiko: {
    name: "Aiko Tanabe",
    title: "Head of Site Selection",
    employer: "Thornbury Compute",
    location: "Osaka, Japan",
  },
  elena: {
    name: "Elena Duarte",
    title: "Research Lead",
    employer: "Kestrel Applied Intelligence",
    location: "Lisbon, Portugal",
  },
  marcus: {
    name: "Marcus Bell",
    title: "Regulatory Affairs Manager",
    employer: "Cascade Power Authority",
    location: "Portland, United States",
  },
};

interface Article {
  kind: "written" | "audio" | "video";
  title: string;
  summary: string;
  author: keyof typeof PEOPLE;
  date: string;
  minutes?: number;
  readers: number;
  series?: string;
  part?: number;
}

const ARTICLES: Article[] = [
  {
    kind: "written",
    title: "Questions worth asking before a pilot",
    summary:
      "Six things I now ask before agreeing to a machine learning pilot on infrastructure data, most of which I learned by not asking them.",
    author: "elena",
    date: "7 August 2026",
    minutes: 3,
    readers: 4,
  },
  {
    kind: "written",
    title: "Reading an interconnection request, from the side that sends them",
    summary:
      "What is actually behind the date on a large load request, why it moves, and what a planner could ask for that would make it more useful.",
    author: "aiko",
    date: "31 July 2026",
    minutes: 3,
    readers: 6,
  },
  {
    kind: "written",
    title: "Where a forecast usually goes wrong",
    summary:
      "In my experience it is almost never the model. It is the handoff: the assumption somebody carried forward without being told it was an assumption.",
    author: "tomas",
    date: "23 July 2026",
    minutes: 3,
    readers: 9,
    series: "Forecasting, from the inside",
    part: 2,
  },
  {
    kind: "written",
    title: "What a load forecast is actually made of",
    summary:
      "A forecast is not a number. It is a stack of assumptions made by different people for different reasons, and the number on top is only as good as the least examined thing underneath it.",
    author: "dana",
    date: "10 July 2026",
    minutes: 4,
    readers: 11,
    series: "Forecasting, from the inside",
    part: 1,
  },
];

/** The lead article's body, for the reading page. */
const LEAD_BODY = [
  "Every planning conversation eventually arrives at a forecast, and most of them treat it as a single number. It is not. It is a stack of assumptions, each one made by a different person for a different reason, and the figure at the top is only as good as the least examined thing underneath it.",
  "The bottom of the stack is usually weather. Somebody chose a set of historical years to stand for normal conditions, and somebody else decided how far back normal should reach. Those two choices move the answer more than most of what sits above them, and they are rarely revisited once they have been written into a spreadsheet and inherited by the next analyst.",
  "Above that sits customer growth, which is where a forecast stops being arithmetic and starts being judgement. Counting premises is straightforward. Counting what is inside them is not, and what is inside them has changed faster in the last decade than the methods built to count it.",
  "The layer getting the most attention now is large single loads. A manufacturing plant or a compute site does not arrive gradually. It arrives as one request with a date attached, and the date is frequently wrong in both directions. Planners have learned to treat these as probabilities rather than commitments, which is a real change in method and one worth being explicit about rather than making quietly in the corner of a model.",
  "None of this is a criticism of forecasting. It is an argument for showing the stack. A forecast presented as a number invites an argument about the number. A forecast presented as its assumptions invites an argument about the assumptions, which is the argument worth having.",
];

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The avatar, which is a letter until somebody uploads a photo.
 *
 * Designed for the empty case on purpose. Every seeded member has no photo and
 * so will most real members on day one, so if this looks deliberate when it is
 * empty the directory looks better once it fills rather than worse.
 */
function avatar(name: string, size: "sm" | "md" | "lg" | "large" = "sm"): string {
  return `<span class="avatar ${size}" aria-hidden="true">${esc(name.trim().charAt(0))}</span>`;
}

const KIND_LABEL = { written: "Written", audio: "Audio", video: "Video" } as const;

function meta(a: Article): string {
  return a.kind === "written" && a.minutes
    ? `${KIND_LABEL[a.kind]}, ${a.minutes} minute read`
    : KIND_LABEL[a.kind];
}

function readers(n: number): string {
  if (n === 0) return "No readers yet";
  return n === 1 ? "Read by 1 member" : `Read by ${n} members`;
}

function byline(a: Article): string {
  const p = PEOPLE[a.author];
  return `<p class="muted small">
    <span class="byline-inline">${avatar(p.name)}<a href="#directory">${esc(p.name)}</a></span>
    <span class="dot"> / </span>${esc(a.date)}
    <span class="dot"> / </span>${esc(readers(a.readers))}
  </p>`;
}

function tag(a: Article): string {
  return `<span class="tag ${a.kind}">${esc(meta(a))}</span>`;
}

/* ---------------------------------------------------------------------------
 * The shell
 * ------------------------------------------------------------------------- */

function shell(current: string): string {
  const links = ["Home", "Library", "Publish", "Members", "Your profile", "Admin"];
  return `<header class="masthead">
  <div class="masthead-bar">
    <div class="wrap row">
      <a class="wordmark" href="#home">
        <span class="mark" aria-hidden="true"></span>
        <span>${esc(CLUB)}</span>
      </a>
      <div class="me">
        <span class="me-name">James Smith</span>
        ${avatar("James")}
      </div>
    </div>
  </div>
  <nav class="masthead-nav">
    <div class="wrap">
      <ul>
        ${links
          .map(
            (l) =>
              `<li><a href="#${l.toLowerCase().replace(/\s+/g, "-")}"${
                l === current ? ' class="current" aria-current="page"' : ""
              }>${esc(l)}</a></li>`,
          )
          .join("\n        ")}
      </ul>
    </div>
  </nav>
</header>`;
}

function footer(): string {
  return `<footer class="foot">
  <div class="wrap">
    <p class="foot-name">${esc(CLUB)}</p>
    <p class="muted sm">A private forum. Nothing here is public, and nothing is indexed.</p>
    <p class="muted sm foot-links">
      <span>Privacy</span><span class="sep">/</span><span>Non-solicitation</span><span class="sep">/</span><span>Competition policy</span>
    </p>
  </div>
</footer>`;
}

/* ---------------------------------------------------------------------------
 * The pages
 * ------------------------------------------------------------------------- */

function home(): string {
  const latest = ARTICLES.slice(0, 3);
  return `${shell("Home")}
<section class="hero">
  <div class="wrap">
    <p class="eyebrow">Welcome back</p>
    <h1>James</h1>
    <p class="lede">${esc(ARTICLE_COPY.homeLede)}</p>
  </div>
</section>

<main>
  <p class="notice"><strong>Your profile is still thin.</strong> A photo or a few lines on what you work on is what makes other members reach out. <a href="#your-profile">Finish it</a>.</p>

  <section>
    <h2 class="section-head">Latest in the library <a class="more" href="#library">See all</a></h2>
    <div class="cards">
      ${latest
        .map(
          (a) => `<article class="card">
        ${tag(a)}
        <h3><a href="#article">${esc(a.title)}</a></h3>
        <p class="muted">${esc(a.summary)}</p>
        <p class="byline sm">${avatar(PEOPLE[a.author].name)}<span>${esc(PEOPLE[a.author].name)}</span></p>
      </article>`,
        )
        .join("\n      ")}
    </div>
  </section>

  <section>
    <h2 class="section-head">Members <a class="more" href="#members">See all</a></h2>
    <div class="faces">
      ${Object.values(PEOPLE)
        .slice(0, 4)
        .map(
          (p) => `<a class="face" href="#directory">
        ${avatar(p.name, "md")}
        <span class="face-name">${esc(p.name)}</span>
        <span class="muted sm">${esc(p.title)}, ${esc(p.employer)}</span>
      </a>`,
        )
        .join("\n      ")}
    </div>
  </section>

  <p class="notice quiet"><strong>You administer this club.</strong> Membership requests are reviewed in <a href="#admin">Admin</a>, and you are emailed whenever one arrives.</p>
</main>
${footer()}`;
}

function library(): string {
  return `${shell("Library")}
<main class="list-page">
  <h1>The library</h1>
  <p class="muted">${esc(ARTICLE_COPY.libraryIntro)}</p>

  <ul class="shelves">
    <li class="shelf-label" aria-hidden="true">Series</li>
    <li><a href="#library">Forecasting, from the inside</a></li>
  </ul>

  <ul class="library">
    ${ARTICLES.map(
      (a, i) => `<li${i === 0 ? ' class="lead"' : ""}>
      <p class="kind">${tag(a)}${
        a.series ? `<span class="dot"> / </span><a class="in-series" href="#library">${esc(a.series)}</a>` : ""
      }</p>
      <h2><a href="#article">${esc(a.title)}</a></h2>
      <p class="summary">${esc(a.summary)}</p>
      ${byline(a)}
    </li>`,
    ).join("\n    ")}
  </ul>
</main>
${footer()}`;
}

function article(): string {
  const a = ARTICLES[3];
  const p = PEOPLE[a.author];
  return `${shell("Library")}
<main class="reading">
  <p class="muted small">
    <a href="#library">Back to the library</a>
    <span class="dot"> / </span><a href="#library">${esc(a.series ?? "")}</a>
  </p>

  <p class="kind">${tag(a)}<span class="dot"> / </span><span class="muted">Part ${a.part}</span></p>
  <h1>${esc(a.title)}</h1>
  <p class="standfirst">${esc(a.summary)}</p>

  <div class="profile-head byline-block">
    ${avatar(p.name, "md")}
    <div>
      <p><a href="#directory">${esc(p.name)}</a></p>
      <p class="muted small">${esc(p.title)}, ${esc(p.employer)}<span class="dot"> / </span>${esc(a.date)}</p>
    </div>
  </div>

  <div class="article-body">\n  ${LEAD_BODY.map((para) => `<p class="prose">${esc(para)}</p>`).join("\n  ")}\n  </div>

  <p class="muted small readers">${esc(readers(a.readers))}</p>

  <section class="series-box">
    <h2>${esc(a.series ?? "")}</h2>
    <ol class="series-list">
      <li aria-current="page"><span>${esc(a.title)}</span></li>
      <li><a href="#article">Where a forecast usually goes wrong</a></li>
    </ol>
  </section>
</main>
${footer()}`;
}

function directory(): string {
  return `${shell("Members")}
<main class="wide">
  <h1>Members</h1>
  <p class="muted">Six people, visible only to each other.</p>

  <ul class="directory">
    ${Object.values(PEOPLE)
      .map(
        (p) => `<li><a href="#profile">
      ${avatar(p.name, "lg")}
      <span class="person-name">${esc(p.name)}</span>
      <span class="person-role">${esc(p.title)}</span>
      <span class="muted small">${esc(p.employer)}</span>
      <span class="muted small place">${esc(p.location)}</span>
    </a></li>`,
      )
      .join("\n    ")}
  </ul>
</main>
${footer()}`;
}

function profile(): string {
  const p = PEOPLE.dana;
  return `${shell("Members")}
<main class="reading">
  <p class="muted small"><a href="#directory">Back to members</a></p>

  <div class="profile-head">
    ${avatar(p.name, "large")}
    <div>
      <h1>${esc(p.name)}</h1>
      <p class="muted">${esc(p.title)}, ${esc(p.employer)}</p>
      <p class="muted">${esc(p.location)}</p>
    </div>
  </div>

  <section>
    <h2>What they work on</h2>
    <p class="prose">${esc(p.career ?? "")}</p>
  </section>

  <section>
    <h2>What they want to learn or discuss</h2>
    <p class="prose">${esc(p.interests ?? "")}</p>
  </section>
</main>
${footer()}`;
}



/**
 * The front door, which is the screen three founders meet before anything else.
 *
 * Here because it was the one page nobody looked at after the design pass. It
 * was a heading and an email box on a white page, with nothing on it to say
 * whose door it was.
 */
function signIn(): string {
  return `<header class="masthead">
  <div class="masthead-bar">
    <div class="wrap row">
      <span class="wordmark"><span class="mark" aria-hidden="true"></span><span>${esc(CLUB)}</span></span>
    </div>
  </div>
</header>
<main class="reading">
  <h1>Sign in</h1>
  <p class="lede">${esc(CLUB)} is a private forum. Members publish written pieces, audio recordings, and video, and everything inside is visible only to them.</p>
  <p class="muted">Enter your email and we will send you a link. There is no password to remember. If you have not joined yet, this is also where you start.</p>

  <form>
    <div class="field">
      <label for="e">Email address</label>
      <input id="e" type="email" placeholder="you@example.com">
    </div>
    <button type="button">Send me a link</button>
  </form>
</main>
${footer()}`;
}

/** The page a member lands on from "Publish", where the three doors live. */
function pieces(): string {
  const doors = ARTICLE_KIND_OPTIONS.map(
    (k) => `<a class="card start" href="#write">
        <span class="tag ${k.value}">${esc(k.noun)}</span>
        <h3>${esc(k.action)}</h3>
        <p class="muted">${esc(k.help)}</p>
      </a>`,
  ).join("\n      ");

  return `${shell("Publish")}
<main class="wide">
  <h1>${esc(ARTICLE_COPY.writeTitle)}</h1>
  <p class="muted">${esc(ARTICLE_COPY.writeIntro)}</p>

  <h2 class="section-head">${esc(ARTICLE_COPY.startTitle)}</h2>
  <div class="cards">
      ${doors}
  </div>

  <h2 class="section-head">Published and drafts</h2>
  <div class="table-scroll">
    <table class="members">
      <thead><tr><th>Piece</th><th>State</th><th>Readers</th><th></th></tr></thead>
      <tbody>
        <tr>
          <td><h3>What a load forecast is actually made of</h3><span class="muted small">Written, 4 minute read</span></td>
          <td>Published<br><span class="muted small">10 July 2026</span></td>
          <td class="muted small">Read by 11 members</td>
          <td><a href="#write">Edit</a><span class="dot"> / </span><a href="#article">Read</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</main>
${footer()}`;
}

/**
 * The editor, in the state an author first meets it.
 *
 * Here because a self-test found the audio and video fields hard to find, and
 * the reason is visible only when you look at the first screen rather than at
 * the component: the kind picker defaults to Written, and the audio and video
 * fields do not exist until it is changed. Whether that reads as a choice or as
 * the only option is a question about this screenshot.
 */
function write(): string {
  const kinds = ARTICLE_KIND_OPTIONS.map(
    (k, i) => `<label class="choice">
        <input type="radio" name="kind"${i === 0 ? " checked" : ""}>
        <span>
          <span>${esc(k.label)}</span>
          <span class="help">${esc(k.help)}</span>
        </span>
      </label>`,
  ).join("\n      ");

  return `${shell("Publish")}
<main class="reading">
  <p class="muted small"><a href="#write">Back to what you have written</a></p>
  <h1>Write something</h1>

  <form>
    <fieldset class="field">
      <legend>What kind of piece is this?</legend>
      ${kinds}
    </fieldset>

    <div class="field">
      <label for="t">Title</label>
      <input id="t" type="text">
    </div>

    <div class="field">
      <label for="s">Summary <span class="optional">(optional)</span></label>
      <p class="help">One or two lines. This is what members see in the library, so it is the part most of them read.</p>
      <textarea id="s" rows="2"></textarea>
    </div>

    <div class="field">
      <label for="b">The piece</label>
      <textarea id="b" rows="10"></textarea>
    </div>

    <p class="notice">Publishing puts this in front of every member straight away. You can take it back to a draft afterwards, and an administrator can remove it.</p>
    <p class="muted small">A reminder before you publish: write about published results, methods, and your own experience. Please leave out forward-looking plans, pricing, and capacity decisions.</p>

    <div class="decide">
      <button type="button">Publish</button>
      <button type="button" class="quiet">Save as a draft</button>
    </div>
  </form>
</main>
${footer()}`;
}

/**
 * The stylesheet under review is the one that ships, read from disk, with the
 * club's tokens in front of it exactly as layout.tsx emits them.
 *
 * The review chrome is appended rather than mixed in, and is deliberately ugly
 * so it is never mistaken for the design.
 */
const shipped = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");
const tokens = themeCss(resolveTheme(ELECTRIC_GRID_THEME));

const reviewCss = `
.review { background: #1b1b1f; color: #fff; font-family: var(--sans); font-size: 0.82rem; }
.review .wrap { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; padding-top: 0.5rem; padding-bottom: 0.5rem; }
.review strong { margin-right: 0.6rem; font-weight: 600; }
.review a { color: #fff; text-decoration: none; padding: 0.2rem 0.6rem; border: 1px solid rgba(255,255,255,0.28); border-radius: 999px; }
.review a:hover { background: rgba(255,255,255,0.12); }
.note { background: #fffbe9; border-bottom: 1px solid #efdfae; font-size: 0.9rem; }
.note .wrap { padding-top: 1rem; padding-bottom: 1rem; }
.note p { margin: 0 0 0.5rem; max-width: 52rem; }
.note p:last-child { margin: 0; }
.page { border-bottom: 12px solid #e9eef1; }
`;

/* ---------------------------------------------------------------------------
 * Assembly
 * ------------------------------------------------------------------------- */

const PAGES: { id: string; label: string; html: string }[] = [
  { id: "signin", label: "Sign in", html: signIn() },
  { id: "home", label: "Home", html: home() },
  { id: "library", label: "Library", html: library() },
  { id: "article", label: "An article", html: article() },
  { id: "directory", label: "Members", html: directory() },
  { id: "profile", label: "One member", html: profile() },
  { id: "pieces", label: "Publish", html: pieces() },
  { id: "write", label: "The editor", html: write() },
];

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(CLUB)}: member area, proposed look</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet">
<style>${tokens}</style>\n<style>${shipped}</style>\n<style>${reviewCss}</style>
</head>
<body>

<div class="review">
  <div class="wrap">
    <strong>Mockup</strong>
    ${PAGES.map((p) => `<a href="#${p.id}">${esc(p.label)}</a>`).join("\n    ")}
  </div>
</div>

<div class="note">
  <div class="wrap">
    <p><strong>What this is.</strong> Five pages of the member area as they would look after a design pass, so the direction can be judged before it is built. Static HTML: nothing is clickable and nothing is real except the colours.</p>
    <p><strong>The colours are not a proposal.</strong> They are imported from the theme you approved on the marketing page, so what changes below is structure, typography, and spacing rather than the palette.</p>
    <p><strong>The people and articles are the seeded demonstration content.</strong> All fictional, and all removed before anyone real joins.</p>
    <p><strong>Worth reacting to:</strong> the navy masthead, whether the library reads as a publication, the article page, and whether the letter avatars are acceptable until people upload photos.</p>
  </div>
</div>

${PAGES.map((p) => `<div class="page" id="${p.id}">\n${p.html}\n</div>`).join("\n\n")}

</body>
</html>
`;

const outDir = resolve(__dirname, "../../../preview");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "members-mockups.html");
writeFileSync(outFile, doc, "utf8");
console.log(`Wrote ${outFile} (${(doc.length / 1024).toFixed(1)}kB, ${PAGES.length} pages)`);

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
 * The colours are imported from ELECTRIC_GRID_THEME rather than retyped, so
 * what is reviewed is provably the palette the client already signed off on the
 * marketing page. That import is also the argument for the change it implies:
 * apps/members currently hand-copies those five values into globals.css, which
 * is correct today and wrong the moment either side changes.
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
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { ELECTRIC_GRID_THEME } from "../../platform/src/lib/clients/electric-grid";

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
function avatar(name: string, size: "sm" | "md" | "lg" = "sm"): string {
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
  return `<p class="byline">
    ${avatar(p.name)}
    <span><a href="#directory">${esc(p.name)}</a></span>
    <span class="sep">/</span><span>${esc(a.date)}</span>
    <span class="sep">/</span><span>${esc(readers(a.readers))}</span>
  </p>`;
}

function tag(a: Article): string {
  return `<span class="tag ${a.kind}">${esc(meta(a))}</span>`;
}

/* ---------------------------------------------------------------------------
 * The shell
 * ------------------------------------------------------------------------- */

function shell(current: string): string {
  const links = ["Home", "Library", "Write", "Members", "Your profile", "Admin"];
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
      <a href="#">Privacy</a><span class="sep">/</span><a href="#">Non-solicitation</a><span class="sep">/</span><a href="#">Competition policy</a>
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
<main class="wrap">
  <section class="greeting">
    <p class="eyebrow">Welcome back</p>
    <h1>James</h1>
    <p class="lede">Six members, four published pieces, and one series so far.</p>
  </section>

  <div class="callout">
    <p><strong>Your profile is still thin.</strong> A photo or a few lines on what you work on is what makes other members reach out. <a href="#your-profile">Finish it</a>.</p>
  </div>

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
        <span class="muted sm">${esc(p.employer)}</span>
      </a>`,
        )
        .join("\n      ")}
    </div>
  </section>

  <div class="callout quiet">
    <p><strong>You administer this club.</strong> Membership requests are reviewed in <a href="#admin">Admin</a>, and you are emailed whenever one arrives.</p>
  </div>
</main>
${footer()}`;
}

function library(): string {
  const [lead, ...rest] = ARTICLES;
  return `${shell("Library")}
<main class="wrap list-page">
  <section class="page-head">
    <h1>The library</h1>
    <p class="lede">Everything members have published. Written pieces, recordings, and video, visible only inside the club.</p>
    <p class="shelves"><span class="shelf-label">Series</span><a class="shelf" href="#library">Forecasting, from the inside</a></p>
  </section>

  <article class="lead">
    ${tag(lead)}
    ${lead.series ? `<span class="sep">/</span><a class="in-series" href="#library">${esc(lead.series)}</a>` : ""}
    <h2><a href="#article">${esc(lead.title)}</a></h2>
    <p class="lead-summary">${esc(lead.summary)}</p>
    ${byline(lead)}
  </article>

  <ul class="list">
    ${rest
      .map(
        (a) => `<li>
      <p class="kindline">${tag(a)}${
        a.series ? `<span class="sep">/</span><a class="in-series" href="#library">${esc(a.series)}</a>` : ""
      }</p>
      <h3><a href="#article">${esc(a.title)}</a></h3>
      <p class="muted">${esc(a.summary)}</p>
      ${byline(a)}
    </li>`,
      )
      .join("\n    ")}
  </ul>
</main>
${footer()}`;
}

function article(): string {
  const a = ARTICLES[3];
  const p = PEOPLE[a.author];
  return `${shell("Library")}
<main class="wrap reading">
  <p class="crumbs"><a href="#library">The library</a><span class="sep">/</span><a href="#library">${esc(a.series ?? "")}</a></p>

  <p class="kindline">${tag(a)}<span class="sep">/</span><span class="muted">Part ${a.part}</span></p>
  <h1 class="article-title">${esc(a.title)}</h1>
  <p class="standfirst">${esc(a.summary)}</p>

  <div class="author-block">
    ${avatar(p.name, "md")}
    <div>
      <p class="author-name"><a href="#directory">${esc(p.name)}</a></p>
      <p class="muted sm">${esc(p.title)}, ${esc(p.employer)}<span class="sep">/</span>${esc(a.date)}</p>
    </div>
  </div>

  <div class="prose">
    ${LEAD_BODY.map((para) => `<p>${esc(para)}</p>`).join("\n    ")}
  </div>

  <p class="readers">${esc(readers(a.readers))}</p>

  <section class="series-box">
    <h2>More in ${esc(a.series ?? "")}</h2>
    <ol>
      <li class="here"><span>${esc(a.title)}</span></li>
      <li><a href="#article">Where a forecast usually goes wrong</a></li>
      <li class="pending"><span>A conversation about forecasting horizons</span><span class="pill">Not published yet</span></li>
    </ol>
  </section>
</main>
${footer()}`;
}

function directory(): string {
  return `${shell("Members")}
<main class="wrap">
  <section class="page-head">
    <h1>Members</h1>
    <p class="lede">Six people, visible only to each other. Nothing on this page is public.</p>
  </section>

  <div class="people">
    ${Object.values(PEOPLE)
      .map(
        (p) => `<a class="person" href="#profile">
      ${avatar(p.name, "lg")}
      <span class="person-name">${esc(p.name)}</span>
      <span class="person-role">${esc(p.title)}</span>
      <span class="muted sm">${esc(p.employer)}</span>
      <span class="muted sm place">${esc(p.location)}</span>
    </a>`,
      )
      .join("\n    ")}
  </div>
</main>
${footer()}`;
}

function profile(): string {
  const p = PEOPLE.dana;
  return `${shell("Members")}
<main class="wrap reading">
  <p class="crumbs"><a href="#directory">Members</a></p>

  <div class="profile-head">
    ${avatar(p.name, "lg")}
    <div>
      <h1>${esc(p.name)}</h1>
      <p class="lede">${esc(p.title)}, ${esc(p.employer)}</p>
      <p class="muted">${esc(p.location)}</p>
    </div>
  </div>

  <section>
    <h2 class="section-head">What they work on</h2>
    ${(p.career ?? "").split("\n\n").map((x) => `<p>${esc(x)}</p>`).join("\n    ")}
  </section>

  <section>
    <h2 class="section-head">What they want to learn or discuss</h2>
    <p>${esc(p.interests ?? "")}</p>
  </section>

  <section>
    <h2 class="section-head">Published</h2>
    <ul class="list tight">
      <li>
        <p class="kindline"><span class="tag written">Written, 4 minute read</span></p>
        <h3><a href="#article">What a load forecast is actually made of</a></h3>
        <p class="byline sm"><span>10 July 2026</span><span class="sep">/</span><span>Read by 11 members</span></p>
      </li>
    </ul>
  </section>
</main>
${footer()}`;
}

/* ---------------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------------- */

const css = `
:root {
  --bg: ${colors.background};
  --ink: ${colors.text};
  --navy: ${colors.primary};
  --green: ${colors.accent};
  --muted: ${colors.muted};
  --line: #dde5ea;
  --wash: #f5f8f9;
  --serif: "Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif;
  --sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--navy); }
p { margin: 0 0 1rem; }
.wrap { max-width: 62rem; margin: 0 auto; padding: 0 1.75rem; }
.muted { color: var(--muted); }
.sm { font-size: 0.9rem; }
.sep { color: var(--line); padding: 0 0.5rem; }

/* --- Masthead. A deep navy band is the cheapest way to make a page feel like
       an institution rather than a form. The nav sits on white below it, so the
       colour is a statement rather than a background somebody has to read on. */
.masthead-bar { background: var(--navy); color: #fff; }
.masthead-bar .row { display: flex; align-items: center; justify-content: space-between; height: 4.25rem; }
.wordmark {
  display: flex; align-items: center; gap: 0.7rem;
  color: #fff; text-decoration: none;
  font-family: var(--serif); font-size: 1.2rem; letter-spacing: 0.005em;
}
.mark {
  width: 1.5rem; height: 1.5rem; flex: none; border-radius: 4px;
  background: linear-gradient(150deg, var(--green) 0%, #1d7a54 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22);
}
.me { display: flex; align-items: center; gap: 0.7rem; }
.me-name { font-size: 0.9rem; color: rgba(255,255,255,0.82); }
.me .avatar { background: rgba(255,255,255,0.14); color: #fff; }

.masthead-nav { border-bottom: 1px solid var(--line); background: #fff; }
.masthead-nav ul { display: flex; flex-wrap: wrap; gap: 1.6rem; list-style: none; margin: 0; padding: 0; }
.masthead-nav a {
  display: inline-block; padding: 0.85rem 0;
  color: var(--muted); text-decoration: none;
  font-size: 0.9rem; font-weight: 500;
  border-bottom: 2px solid transparent;
}
.masthead-nav a:hover { color: var(--ink); }
.masthead-nav a.current { color: var(--navy); font-weight: 600; border-bottom-color: var(--green); }

main { padding: 3rem 1.75rem 4.5rem; }
main.reading { max-width: 45rem; }
main.list-page { max-width: 50rem; }

h1 { font-family: var(--serif); color: var(--navy); font-size: 2.4rem; line-height: 1.15; margin: 0 0 0.6rem; letter-spacing: -0.01em; }
h2, h3 { font-family: var(--serif); color: var(--navy); margin: 0 0 0.4rem; line-height: 1.25; }
.lede { font-size: 1.1rem; color: var(--muted); margin-bottom: 0; }

.eyebrow { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); font-weight: 700; margin: 0 0 0.35rem; }
.greeting { margin-bottom: 2.25rem; }
.page-head { margin-bottom: 2.5rem; }

.section-head {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 1.05rem; letter-spacing: 0.01em;
  margin: 2.75rem 0 1.1rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--line);
}
.more { font-family: var(--sans); font-size: 0.85rem; font-weight: 500; text-decoration: none; color: var(--muted); }
.more:hover { color: var(--navy); }

/* --- Tags. The word always carries the meaning; colour only reinforces it. */
.tag {
  display: inline-block; padding: 0.12rem 0.6rem; border-radius: 999px;
  border: 1px solid var(--line); background: #fff;
  font-size: 0.76rem; font-weight: 600; letter-spacing: 0.02em; color: var(--muted);
  vertical-align: middle;
}
.tag.audio { border-color: #b6ddca; color: #1d7a54; background: #f2faf6; }
.tag.video { border-color: #e2cf9f; color: #85631a; background: #fdf9ef; }
.kindline { font-size: 0.82rem; margin: 0 0 0.5rem; }

.byline { display: flex; align-items: center; gap: 0.15rem; font-size: 0.88rem; color: var(--muted); margin: 0.75rem 0 0; flex-wrap: wrap; }
.byline .avatar { margin-right: 0.5rem; }
.byline a { color: var(--muted); text-decoration-color: var(--line); }
.byline a:hover { color: var(--navy); }

.avatar {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; flex: none; border-radius: 50%;
  background: #e8eef2; color: var(--navy);
  font-family: var(--serif); font-size: 0.85rem; line-height: 1;
}
.avatar.md { width: 2.75rem; height: 2.75rem; font-size: 1.2rem; }
.avatar.lg { width: 4rem; height: 4rem; font-size: 1.7rem; }

/* --- Callouts */
.callout { border-left: 3px solid var(--green); background: var(--wash); padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin: 0 0 1rem; }
.callout p { margin: 0; }
.callout.quiet { border-left-color: var(--line); margin-top: 2.75rem; }

/* --- Cards */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1.1rem; }
.card { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 12px; padding: 1.25rem 1.35rem; background: #fff; transition: border-color .15s, box-shadow .15s; }
.card:hover { border-color: #c3d2db; box-shadow: 0 2px 14px rgba(13,43,69,0.06); }
.card h3 { font-size: 1.12rem; margin: 0.55rem 0 0.45rem; }
.card h3 a { text-decoration: none; }
.card h3 a:hover { text-decoration: underline; }
.card p.muted { font-size: 0.92rem; }
.card .byline { margin-top: auto; padding-top: 0.9rem; }

/* --- The library. The newest piece gets more room, which is what makes a list
       of articles read as a publication rather than as search results. */
.shelves { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; margin: 1.25rem 0 0; }
.shelf-label { font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--muted); font-weight: 700; }
.shelf { display: inline-block; padding: 0.3rem 0.85rem; border: 1px solid var(--line); border-radius: 999px; font-size: 0.88rem; text-decoration: none; }
.shelf:hover { border-color: var(--green); }

.lead { padding: 2rem 0 2.25rem; border-top: 2px solid var(--navy); border-bottom: 1px solid var(--line); }
.lead h2 { font-size: 2rem; margin: 0.6rem 0 0.6rem; letter-spacing: -0.01em; }
.lead h2 a { text-decoration: none; }
.lead h2 a:hover { text-decoration: underline; }
.lead-summary { font-size: 1.12rem; color: var(--muted); margin: 0; }
.in-series { font-size: 0.82rem; text-decoration-color: var(--line); }

.list { list-style: none; margin: 0; padding: 0; }
.list li { padding: 1.75rem 0; border-bottom: 1px solid var(--line); }
.list h3 { font-size: 1.35rem; margin-bottom: 0.4rem; }
.list h3 a { text-decoration: none; }
.list h3 a:hover { text-decoration: underline; }
.list p.muted { margin: 0; }
.list.tight li { padding: 1.1rem 0; }

/* --- Reading. Narrower measure and larger type, because this is the one page
       people are meant to stay on. */
.crumbs { font-size: 0.88rem; color: var(--muted); margin-bottom: 1.75rem; }
.crumbs a { color: var(--muted); }
.article-title { font-size: 2.6rem; margin-bottom: 0.75rem; }
.standfirst { font-size: 1.2rem; line-height: 1.5; color: var(--muted); margin-bottom: 1.75rem; }
.author-block { display: flex; align-items: center; gap: 0.9rem; padding: 1.1rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); margin-bottom: 2.25rem; }
.author-block p { margin: 0; }
.author-name { font-weight: 600; }
.author-name a { text-decoration: none; }
.prose p { font-size: 1.09rem; line-height: 1.78; margin-bottom: 1.4rem; }
.prose p:first-child::first-letter { font-family: var(--serif); font-size: 3.1rem; line-height: 0.85; float: left; padding: 0.14em 0.09em 0 0; color: var(--navy); }
.readers { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--line); font-size: 0.9rem; color: var(--muted); }

.series-box { background: var(--wash); border-radius: 12px; padding: 1.4rem 1.6rem; margin-top: 2.5rem; }
.series-box h2 { font-size: 1.05rem; margin-bottom: 0.75rem; }
.series-box ol { margin: 0; padding-left: 1.2rem; }
.series-box li { padding: 0.3rem 0; }
.series-box li.here { font-weight: 600; color: var(--navy); }
.series-box li.pending { color: var(--muted); }
.pill { display: inline-block; margin-left: 0.5rem; padding: 0.02rem 0.5rem; border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: 0.72rem; }

/* --- People */
.faces { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; }
.face { display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem; padding: 1.1rem; border: 1px solid var(--line); border-radius: 12px; text-decoration: none; color: inherit; }
.face:hover { border-color: #c3d2db; background: var(--wash); }
.face .avatar { margin-bottom: 0.55rem; }
.face-name { font-weight: 600; font-size: 0.95rem; }

.people { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.1rem; }
.person { display: flex; flex-direction: column; gap: 0.12rem; padding: 1.5rem; border: 1px solid var(--line); border-radius: 12px; text-decoration: none; color: inherit; transition: border-color .15s, box-shadow .15s; }
.person:hover { border-color: #c3d2db; box-shadow: 0 2px 14px rgba(13,43,69,0.06); }
.person .avatar { margin-bottom: 0.75rem; }
.person-name { font-family: var(--serif); font-size: 1.2rem; color: var(--navy); }
.person-role { font-size: 0.95rem; margin-bottom: 0.2rem; }
.place { margin-top: 0.5rem; }

.profile-head { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 2rem; }
.profile-head h1 { font-size: 2.1rem; margin-bottom: 0.3rem; }
.profile-head p { margin: 0; }

/* --- Footer */
.foot { border-top: 1px solid var(--line); background: var(--wash); padding: 2.5rem 0 3rem; margin-top: 4rem; }
.foot-name { font-family: var(--serif); color: var(--navy); font-size: 1.05rem; margin-bottom: 0.2rem; }
.foot p { margin: 0 0 0.3rem; }
.foot-links a { color: var(--muted); }

@media (max-width: 42rem) {
  body { font-size: 16px; }
  h1 { font-size: 1.9rem; }
  .article-title { font-size: 2rem; }
  .lead h2 { font-size: 1.55rem; }
  .masthead-nav ul { gap: 1.1rem; }
  .masthead-bar .row { height: 3.75rem; }
  .wordmark { font-size: 1rem; }
  .me-name { display: none; }
  .prose p:first-child::first-letter { font-size: 2.6rem; }
}

/* --- The review chrome. Deliberately ugly so it is never mistaken for the
       design being reviewed. Not part of the product. */
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
  { id: "home", label: "Home", html: home() },
  { id: "library", label: "Library", html: library() },
  { id: "article", label: "An article", html: article() },
  { id: "directory", label: "Members", html: directory() },
  { id: "profile", label: "One member", html: profile() },
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
<style>${css}</style>
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

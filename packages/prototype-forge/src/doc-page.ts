/**
 * Wraps a build document in the same self-contained page shell the prototypes
 * use, with the chain's navigation across the top.
 *
 * The navigation is the teaching design made visible: card, then architecture,
 * then Pattern Book, always in that order, always on screen. A student who is
 * lost can see where they are in the chain without being told.
 */

import { renderMarkdown, escapeHtml } from "./markdown";
import type { PrototypeTheme } from "./types";

export interface DocLink {
  label: string;
  href: string;
  /** The page being rendered, shown as the current step. */
  current?: boolean;
}

export interface DocPageOptions {
  title: string;
  /** Shown under the title, usually the team and product. */
  subtitle?: string;
  markdown: string;
  theme: PrototypeTheme;
  links: DocLink[];
  credit?: string;
  creditHref?: string;
  /**
   * Team slug. When present the page gets the helper box.
   *
   * The box lives on the build pages rather than the prototype because that is
   * where a student is when they get stuck, and the helper's whole job is to
   * send them back into the page they already have open.
   */
  askForTeam?: string;
  /**
   * Which helper the page offers.
   *
   * "build" is the two-door coder helper. "design" is a different job: there is
   * no lookup chain to protect, because nothing about Figma is hidden in the
   * Pattern Book, so that helper may answer directly. What it must not do is
   * invent a component name, which is the one thing the designers' page has to
   * get exactly right.
   *
   * "gap" is the what-next helper. It holds the same list of gaps the page is
   * rendered from, so it answers about this team rather than about teams in
   * general. It is the one box a team with nothing but a plan can still reach,
   * which is why it never turns anybody away for not having done enough yet.
   */
  askKind?: "build" | "design" | "gap";
  /**
   * The team's stories, so they can propose a change to one.
   *
   * Present only on the build cards page. The card is where a team is standing
   * when they realise their story is wrong, but the story is what actually gets
   * edited, and the form says so, otherwise two copies of the same sentence
   * start drifting apart.
   */
  proposeStories?: Array<{ heading: string; text: string }>;
  /**
   * The team's stories, for the debugging helper's story picker.
   *
   * A student who picks the story their code is for gets the whole answer
   * rather than a fix, so the list is on every build page rather than only the
   * cards page. The story travels with the question; the page never changes.
   */
  helperStories?: Array<{ heading: string; text: string }>;
  /**
   * Put the "Share your design" box on the page.
   *
   * Only the design brief carries it: that is the designer's page, and the
   * box is how their Figma file and their team's published Anvil app reach
   * the teacher and the review. It stores links and sends an email. It cannot
   * change a page.
   */
  shareDesign?: boolean;
  /**
   * Set when a build card disagrees with the story it came from.
   *
   * One sentence naming the card and what no longer matches, worked out by
   * comparing the two documents. Saying so beats quietly serving a build guide
   * that no longer matches the story above it. The prototype and the test plan
   * regenerate from the stories, so they are never the ones behind.
   */
  staleNote?: string;
  /** @deprecated The date stamp this replaced. Still honoured when set. */
  staleSince?: string;
  /**
   * Where the team's live progress board is, when they have one.
   *
   * Shown on the cards page as the place to tick things off, because a
   * checkbox on a static page forgets itself on reload and a team that ticked
   * three boxes and lost them does not tick them again.
   */
  boardHref?: string;
}

export function renderDocPage(options: DocPageOptions): string {
  const t = options.theme;
  const credit = options.credit ?? "Built in class with Double Blaze";
  const creditHref = options.creditHref ?? "https://doubleblaze.solutions";

  const nav = options.links
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}"${l.current ? ' aria-current="page"' : ""}>${escapeHtml(l.label)}</a>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(options.title)}</title>
<style>
:root {
  --primary: ${t.primary};
  --accent: ${t.accent};
  --surface: ${t.surface};
  --text: ${t.text};
  --muted: ${t.muted};
  --heading-font: ${t.headingFont};
  --body-font: ${t.bodyFont};
  --line: rgba(0,0,0,.12);
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--body-font); color: var(--text); background: #eeeae5; line-height: 1.6; }
.page { max-width: 820px; margin: 0 auto; padding: 24px 16px 72px; }
header.doc { margin-bottom: 18px; }
header.doc h1 { font-family: var(--heading-font); color: var(--primary); font-size: 1.7rem; margin: 0; }
header.doc p { color: var(--muted); margin: 4px 0 0; font-size: .95rem; }
nav.chain { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 24px; }
nav.chain a {
  font-size: .85rem; padding: 8px 13px; border-radius: 999px; text-decoration: none;
  border: 1px solid var(--line); background: #fff; color: var(--muted);
}
nav.chain a[aria-current="page"] { background: var(--primary); color: #fff; border-color: var(--primary); }
nav.chain a:hover { border-color: var(--primary); }
main { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 28px 30px 34px; }
h1, h2, h3, h4 { font-family: var(--heading-font); color: var(--primary); line-height: 1.3; }
main > h1:first-child { margin-top: 0; }
h2 { font-size: 1.3rem; margin: 32px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
h3 { font-size: 1.05rem; margin: 24px 0 6px; color: var(--text); }
p { margin: 0 0 14px; }
ul, ol { margin: 0 0 16px; padding-left: 22px; }
li { margin-bottom: 6px; }
li.task { list-style: none; margin-left: -22px; }
li.task label { display: flex; gap: 9px; align-items: flex-start; cursor: pointer; }
li.task input { margin-top: 5px; flex: none; width: 16px; height: 16px; accent-color: var(--primary); }
li.task input:checked + span { color: var(--muted); text-decoration: line-through; }
code { background: rgba(0,0,0,.06); padding: 1px 5px; border-radius: 4px; font-size: .9em; }
pre {
  background: #1c1a19; color: #f4f1ee; padding: 15px 17px; border-radius: 10px;
  overflow-x: auto; font-size: .88rem; line-height: 1.55; margin: 0 0 16px;
}
pre code { background: none; padding: 0; color: inherit; }
blockquote { margin: 0 0 16px; padding: 10px 14px; border-left: 3px solid var(--accent); background: rgba(0,0,0,.03); color: var(--muted); }
figure { margin: 0 0 22px; }
figure img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
figcaption { margin-top: 8px; font-size: .85rem; color: var(--muted); text-align: center; }
p > img { max-width: 100%; height: auto; vertical-align: middle; }
hr { border: 0; border-top: 1px solid var(--line); margin: 30px 0; }
.table-scroll { overflow-x: auto; margin: 0 0 18px; }
table { border-collapse: collapse; width: 100%; font-size: .92rem; }
th, td { text-align: left; padding: 8px 11px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { background: rgba(0,0,0,.03); font-family: var(--heading-font); color: var(--primary); }
a { color: var(--accent); }
.board-link { margin: 0 0 20px; padding: 12px 15px; border-radius: 10px; background: rgba(0,0,0,.035); border-left: 4px solid var(--primary); font-size: .95rem; }
.stale { margin: 0 0 20px; padding: 12px 15px; border-radius: 10px; background: #fff5ef; border-left: 4px solid var(--accent); font-size: .92rem; }
.propose { margin-top: 24px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px 22px; }
.propose h2 { font-family: var(--heading-font); font-size: 1.15rem; margin: 0 0 4px; color: var(--primary); border: 0; padding: 0; }
.propose-intro { font-size: .88rem; color: var(--muted); margin: 0 0 14px; }
.propose-label { display: block; font-size: .8rem; font-weight: 600; margin: 12px 0 4px; }
#propose-story, #propose-text, #propose-reason { width: 100%; font: inherit; font-size: .93rem; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; }
#propose-text, #propose-reason { resize: vertical; }
#propose-send { margin-top: 14px; font: inherit; font-size: .95rem; padding: 10px 18px; border-radius: 9px; border: 0; background: var(--primary); color: #fff; cursor: pointer; }
#propose-send:disabled { opacity: .5; cursor: default; }
#propose-result { margin: 12px 0 0; padding: 10px 13px; border-radius: 9px; background: rgba(0,0,0,.04); font-size: .92rem; }
.share input[type=url] { width: 100%; font: inherit; font-size: .95rem; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; }
.share-hint { font-size: .8rem; color: var(--muted); margin: 4px 0 0; }
.ask { margin-top: 24px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px 22px; }
.ask h2 { font-family: var(--heading-font); font-size: 1.15rem; margin: 0 0 4px; color: var(--primary); border: 0; padding: 0; }
.ask-intro { font-size: .88rem; color: var(--muted); margin: 0 0 14px; }
.ask-tabs { display: flex; gap: 6px; margin: 10px 0 14px; flex-wrap: wrap; }
.ask-tabs button { font: inherit; font-size: .85rem; padding: 8px 13px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: var(--muted); cursor: pointer; }
.ask-tabs button[aria-selected="true"] { background: var(--primary); color: #fff; border-color: var(--primary); }
.ask-label { display: block; font-size: .8rem; font-weight: 600; margin: 10px 0 4px; }
#debug-error, #debug-code, #debug-what { width: 100%; font-size: .9rem; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; resize: vertical; }
#debug-error, #debug-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
#debug-send { margin-top: 13px; font: inherit; font-size: .95rem; padding: 10px 18px; border-radius: 9px; border: 0; background: var(--primary); color: #fff; cursor: pointer; }
#debug-send:disabled { opacity: .5; cursor: default; }
#ask-form { display: flex; gap: 8px; align-items: flex-start; }
#ask-input { flex: 1; font: inherit; font-size: .95rem; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; resize: vertical; }
#ask-send { font: inherit; font-size: .95rem; padding: 10px 18px; border-radius: 9px; border: 0; background: var(--primary); color: #fff; cursor: pointer; }
#ask-send:disabled { opacity: .5; cursor: default; }
.ask-bubble { margin-top: 12px; padding: 11px 14px; border-radius: 10px; font-size: .93rem; white-space: pre-wrap; }
.ask-bubble.ask-helper { white-space: normal; }
.ask-helper p { margin: 0 0 10px; }
.ask-helper p:last-child { margin-bottom: 0; }
.ask-helper ul, .ask-helper ol { margin: 0 0 10px; padding-left: 22px; }
.ask-helper li { margin: 3px 0; }
.ask-helper code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em; background: rgba(0,0,0,.06); padding: 1px 5px; border-radius: 4px; }
.ask-code { position: relative; margin: 8px 0 12px; }
.ask-code pre { margin: 0; padding: 12px 14px; padding-top: 30px; background: #1c1a19; color: #f4efe9; border-radius: 9px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; line-height: 1.5; white-space: pre; }
.ask-code pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
.ask-code .ask-file { position: absolute; top: 7px; left: 12px; font-size: .72rem; color: rgba(255,255,255,.6); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.ask-code button { position: absolute; top: 5px; right: 8px; font: inherit; font-size: .75rem; padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; cursor: pointer; }
.ask-code button:hover { background: rgba(255,255,255,.12); }
#debug-story { width: 100%; font: inherit; font-size: .9rem; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; background: #fff; }
#debug-server { width: 100%; font-size: .9rem; padding: 9px 11px; border: 1px solid var(--line); border-radius: 9px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.ask-hint { font-size: .8rem; color: var(--muted); margin: 4px 0 0; }
.ask-you { background: rgba(0,0,0,.05); }
.ask-helper { background: rgba(0,0,0,.03); border-left: 3px solid var(--accent); }
.credit { margin-top: 22px; text-align: center; font-size: .82rem; color: var(--muted); }
.credit a { color: var(--muted); }
@media (max-width: 600px) { main { padding: 20px 18px 26px; } }
</style>
</head>
<body>
<div class="page">
  <header class="doc">
    <h1>${escapeHtml(options.title)}</h1>
    ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ""}
  </header>
  <nav class="chain" aria-label="Build chain">${nav}</nav>
  ${
    options.staleNote
      ? `<p class="stale"><strong>${escapeHtml(options.staleNote)}</strong>
          Check this page against your stories before you follow it.
          Your prototype and test plan are already up to date.</p>`
      : options.staleSince
        ? `<p class="stale"><strong>Your stories changed on ${escapeHtml(options.staleSince)}.</strong>
          This page has not caught up yet, so check it against your stories before you follow it.
          Your prototype is already up to date.</p>`
        : ""
  }
  ${
    options.boardHref
      ? `<p class="board-link"><a href="${escapeHtml(options.boardHref)}"><strong>Your project board</strong></a>: tick off what is done, and it stays ticked for the whole team.</p>`
      : ""
  }
  <main>
${renderMarkdown(options.markdown.replace(/^No em dashes anywhere in this document[^\n]*\n\n?/m, ""))}
  </main>
  ${options.proposeStories && options.proposeStories.length > 0 && options.askForTeam ? proposeBox(options.askForTeam, options.proposeStories) : ""}
  ${options.shareDesign && options.askForTeam ? shareDesignBox(options.askForTeam) : ""}
  ${
    options.askForTeam
      ? options.askKind === "design"
        ? designAskBox(options.askForTeam)
        : options.askKind === "gap"
          ? gapAskBox(options.askForTeam)
          : askBox(options.askForTeam, options.helperStories ?? [])
      : ""
  }
  <p class="credit"><a href="${escapeHtml(creditHref)}">${escapeHtml(credit)}</a></p>
</div>
</body>
</html>
`;
}

/**
 * The propose-a-change box.
 *
 * It states the guarantee up front: nothing changes until the teacher approves.
 * That is worth saying to a twelve year old before they type, both so they know
 * the submission is real and so they know messing about will simply be read by
 * an adult.
 */
function proposeBox(slug: string, stories: Array<{ heading: string; text: string }>): string {
  const options = stories
    .map((s, i) => `<option value="${i}">${escapeHtml(s.heading)}</option>`)
    .join("");
  return `
  <section class="propose" aria-label="Propose a change">
    <h2>Your story is wrong?</h2>
    <p class="propose-intro">
      That happens, and noticing it is good. Rewrite it here and it goes to your
      teacher. <strong>Nothing changes until he approves it.</strong> When he
      does, your story and your prototype update by themselves.
    </p>
    <form id="propose-form">
      <label class="propose-label" for="propose-story">Which story</label>
      <select id="propose-story">${options}</select>

      <label class="propose-label" for="propose-text">What it should say</label>
      <textarea id="propose-text" rows="7" maxlength="1200"></textarea>

      <label class="propose-label" for="propose-reason">Why (this is the part your teacher reads first)</label>
      <textarea id="propose-reason" rows="2" maxlength="400"
        placeholder="We got the user wrong, it should be..."></textarea>

      <button type="submit" id="propose-send">Send to my teacher</button>
    </form>
    <p id="propose-result" hidden></p>
  </section>
<script>
(function () {
  var stories = ${JSON.stringify(stories)};
  var pick = document.getElementById('propose-story');
  var text = document.getElementById('propose-text');
  var reason = document.getElementById('propose-reason');
  var form = document.getElementById('propose-form');
  var send = document.getElementById('propose-send');
  var result = document.getElementById('propose-result');
  var edited = false;

  function load() {
    var s = stories[pick.value];
    if (s && !edited) text.value = s.text;
  }
  text.addEventListener('input', function () { edited = true; });
  pick.addEventListener('change', function () { edited = false; load(); });
  load();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = stories[pick.value];
    if (!s) return;
    send.disabled = true;
    result.hidden = false;
    result.textContent = 'Sending...';
    fetch('/api/trail-crew/suggest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        team: ${JSON.stringify(slug)},
        story: s.heading,
        original: s.text,
        proposed: text.value,
        reason: reason.value
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { result.textContent = data.message || data.error || 'Something went wrong.'; })
      .catch(function () { result.textContent = 'Could not reach the server. Tell your teacher.'; })
      .then(function () { send.disabled = false; });
  });
})();
</script>`;
}

/**
 * The helper box.
 *
 * It says up front that it will not give them code, because a student who
 * discovers that after three attempts feels tricked, and one who is told first
 * uses it for what it is good at.
 */
/**
 * The "Share your design" box.
 *
 * Two links and a line. It states what happens up front, because a designer
 * handing over a term's work deserves to know where it goes: the teacher gets
 * the link, the review reads the file, and nothing on their pages changes by
 * itself. It refuses anything that is not a Figma design link or a published
 * Anvil app, with the exact words for where to find each.
 */
function shareDesignBox(slug: string): string {
  return `
  <section class="propose share" aria-label="Share your design">
    <h2>Share your design</h2>
    <p class="propose-intro">
      Done with a screen, or with all of them? Share the Figma file and it gets
      read against this brief, page by page. A <strong>Design review</strong>
      appears in your pages saying what matches and what does not. Nothing here
      changes anything by itself. The rules it checks are on
      <a href="/build/handover.html">Handing over your design</a>.
    </p>
    <form id="share-form">
      <label class="propose-label" for="share-figma">Your Figma link</label>
      <input type="url" id="share-figma" placeholder="https://www.figma.com/design/..." />
      <p class="share-hint">In Figma: Share, add your teacher's school email as a viewer, then Copy link.</p>

      <label class="propose-label" for="share-anvil">Your published Anvil app, if there is one</label>
      <input type="url" id="share-anvil" placeholder="https://your-app.anvil.app" />
      <p class="share-hint">In Anvil: Publish, then copy the link that ends in .anvil.app.</p>

      <label class="propose-label" for="share-note">One line: what is finished, what is not</label>
      <textarea id="share-note" rows="2" maxlength="400"
        placeholder="All four screens drawn. Builder has no error state yet."></textarea>

      <button type="submit" id="share-send">Share it</button>
    </form>
    <p id="share-result" hidden></p>
  </section>
<script>
(function () {
  var form = document.getElementById('share-form');
  var result = document.getElementById('share-result');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var figma = document.getElementById('share-figma').value.trim();
    var anvil = document.getElementById('share-anvil').value.trim();
    var note = document.getElementById('share-note').value.trim();
    var button = document.getElementById('share-send');
    if (!figma && !anvil) {
      result.hidden = false; result.textContent = 'Paste your Figma link, your Anvil link, or both.';
      return;
    }
    button.disabled = true;
    result.hidden = false; result.textContent = 'Sending...';
    fetch('/api/trail-crew/share-design', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team: ${JSON.stringify(slug)}, figma: figma, anvil: anvil, note: note })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        result.textContent = data.message || data.error || 'Something went wrong. Tell your teacher.';
        if (data.ok) form.reset();
      })
      .catch(function () { result.textContent = 'I could not reach the server. Check you are online, then ask your teacher.'; })
      .then(function () { button.disabled = false; });
  });
})();
</script>`;
}

/**
 * The helper box, with three doors.
 *
 * The refusal in learn mode is right because the answer is in their documents
 * and looking it up is the lesson. An error message is the opposite: nothing in
 * the Pattern Book contains their error, so refusing there teaches nothing and
 * leaves a twelve year old staring at red text, which is where students quit.
 *
 * Labelled boxes rather than a hidden toggle, so a student knows which help
 * they are asking for and why the answers differ. Debug mode is still gated on
 * evidence server side: no error, no code and no description means it is a
 * lookup question and goes back through the mode that teaches.
 *
 * The second door has a story picker. Pick the story the code is for and the
 * helper writes the whole thing rather than a fix. The page says so in one
 * line, because it is the one lever a student has and it should not be a
 * secret.
 *
 * The third door is Figma. The log showed Figma questions typed into the first
 * box and answered by a helper that had never heard of Figma, so the server now
 * routes those to the design helper whatever box they came in on. The tab is
 * there so a student can choose it on purpose rather than only be rescued.
 *
 * Answers are rendered from the small subset of markdown the helper uses,
 * because a fenced block of Python shown as literal backticks is not something
 * a beginner can read, and a copy button on it is the difference between
 * retyping thirty lines on a Chromebook and getting on with it.
 */
function askBox(slug: string, stories: Array<{ heading: string; text: string }>): string {
  const storyOptions = stories
    .map((s, i) => `<option value="${i}">${escapeHtml(s.heading)}</option>`)
    .join("");
  return `
  <section class="ask" aria-label="Ask for help">
    <h2>Stuck?</h2>
    <div class="ask-tabs" role="tablist">
      <button type="button" id="tab-learn" role="tab" aria-selected="true">I do not know what to do</button>
      <button type="button" id="tab-debug" role="tab" aria-selected="false">I tried and it is not working</button>
      <button type="button" id="tab-figma" role="tab" aria-selected="false">I am designing in Figma</button>
    </div>

    <div id="pane-learn">
      <p class="ask-intro">
        I will tell you which page and which pattern answers it. I will not write
        the code, because finding it is what makes you able to do it next time.
      </p>
      <form id="ask-form">
        <textarea id="ask-input" rows="2" maxlength="600"
          placeholder="What are you stuck on?" aria-label="Your question"></textarea>
        <button type="submit" id="ask-send">Ask</button>
      </form>
    </div>

    <div id="pane-debug" hidden>
      <p class="ask-intro">
        Something broken is different. Paste what Anvil is telling you, or the
        code you have, and I will explain what it means and show you the fix.
        <strong>Pick the story it is for and paste your code, and I will write
        the whole thing with your own names in it.</strong>
      </p>
      ${
        stories.length > 0
          ? `<label class="ask-label" for="debug-story">Which story is this code for?</label>
      <select id="debug-story">
        <option value="">Not sure yet (you will get the fix, not the feature)</option>
        ${storyOptions}
      </select>`
          : ""
      }
      <label class="ask-label" for="debug-error">What Anvil says (paste the red text)</label>
      <textarea id="debug-error" rows="3" maxlength="6000"
        placeholder="AttributeError: 'Form1' object has no attribute ..."></textarea>
      <label class="ask-label" for="debug-code">Your Form code</label>
      <textarea id="debug-code" rows="6" maxlength="6000"
        placeholder="Everything in the code view of the Form that is broken. Copy it all, not just the red line."></textarea>
      <label class="ask-label" for="debug-server">Your Server Module code (if this feature has any)</label>
      <textarea id="debug-server" rows="4" maxlength="6000"
        placeholder="The @anvil.server.callable functions this screen calls."></textarea>
      <label class="ask-label" for="debug-what">What you expected to happen</label>
      <textarea id="debug-what" rows="2" maxlength="600"
        placeholder="I clicked save and nothing happened"></textarea>
      <button type="button" id="debug-send">Help me fix it</button>
      <p class="ask-hint">Every question is logged for your teacher, with your team name and nothing else.</p>
    </div>

    <div id="pane-figma" hidden>
      <p class="ask-intro">
        Figma is different again: nothing about it is hidden in your documents, so
        I can just answer. <em>How do I start? How do I make it look like a real
        app? How do I make a button do something? How do I get this into Anvil?</em>
      </p>
      <form id="figma-form">
        <textarea id="figma-input" rows="2" maxlength="600"
          placeholder="What are you trying to make it do, or look like?" aria-label="Your Figma question"></textarea>
        <button type="submit" id="figma-send">Ask</button>
      </form>
    </div>

    <div id="ask-thread" aria-live="polite"></div>
  </section>
<script>
(function () {
  var tabs = {
    learn: { tab: document.getElementById('tab-learn'), pane: document.getElementById('pane-learn') },
    debug: { tab: document.getElementById('tab-debug'), pane: document.getElementById('pane-debug') },
    figma: { tab: document.getElementById('tab-figma'), pane: document.getElementById('pane-figma') }
  };
  var thread = document.getElementById('ask-thread');
  var stories = ${JSON.stringify(stories.map((s) => `${s.heading}\n\n${s.text}`))};
  var history = [];

  function selectTab(which) {
    Object.keys(tabs).forEach(function (k) {
      tabs[k].tab.setAttribute('aria-selected', k === which ? 'true' : 'false');
      tabs[k].pane.hidden = k !== which;
    });
  }
  tabs.learn.tab.addEventListener('click', function () { selectTab('learn'); });
  tabs.debug.tab.addEventListener('click', function () { selectTab('debug'); });
  tabs.figma.tab.addEventListener('click', function () { selectTab('figma'); });

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    return esc(s)
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  }
  // The helper's answers use fences, bullets, numbered steps, bold and code
  // spans. That is the whole grammar, and it is rendered here so a fix arrives
  // as code rather than as a paragraph full of backticks.
  function render(text) {
    var out = '';
    var parts = text.split(/\`\`\`([a-zA-Z0-9_-]*)[^\\n]*\\n([\\s\\S]*?)\`\`\`/);
    for (var i = 0; i < parts.length; i += 3) {
      out += prose(parts[i]);
      if (i + 2 < parts.length) {
        var lang = parts[i + 1] || 'code';
        out += '<div class="ask-code"><span class="ask-file">' + esc(lang) + '</span>'
          + '<button type="button" data-copy>Copy</button><pre><code>' + esc(parts[i + 2].replace(/\\s+$/, '')) + '</code></pre></div>';
      }
    }
    return out;
  }
  function prose(text) {
    var lines = text.split('\\n');
    var out = '';
    var list = null;
    var para = [];
    function flushPara() {
      if (para.length) { out += '<p>' + inline(para.join(' ')) + '</p>'; para = []; }
    }
    function flushList() {
      if (list) { out += '</' + list + '>'; list = null; }
    }
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var bullet = line.match(/^\\s*[-*]\\s+(.*)$/);
      var num = line.match(/^\\s*\\d+[.)]\\s+(.*)$/);
      var head = line.match(/^#{1,6}\\s+(.*)$/);
      if (bullet || num) {
        flushPara();
        var kind = bullet ? 'ul' : 'ol';
        if (list !== kind) { flushList(); out += '<' + kind + '>'; list = kind; }
        out += '<li>' + inline((bullet || num)[1]) + '</li>';
      } else if (head) {
        flushPara(); flushList();
        out += '<p><strong>' + inline(head[1]) + '</strong></p>';
      } else if (!line.trim()) {
        flushPara(); flushList();
      } else {
        flushList();
        para.push(line.trim());
      }
    }
    flushPara(); flushList();
    return out;
  }

  thread.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-copy]');
    if (!btn) return;
    var code = btn.parentNode.querySelector('code').textContent;
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, done);
    else done();
  });

  function bubble(who, text) {
    var el = document.createElement('div');
    el.className = 'ask-bubble ask-' + who;
    el.textContent = text;
    thread.appendChild(el);
    return el;
  }

  function send(payload, shown, button) {
    button.disabled = true;
    bubble('you', shown);
    var pending = bubble('helper', 'Thinking... a whole feature can take half a minute.');
    payload.team = ${JSON.stringify(slug)};
    payload.history = history;
    fetch('/api/trail-crew/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.answer) {
          pending.innerHTML = render(data.answer);
          history.push({ role: 'user', content: shown });
          history.push({ role: 'assistant', content: data.answer });
          history = history.slice(-6);
        } else {
          pending.textContent = data.error || 'Something went wrong. Ask your teacher.';
        }
        pending.scrollIntoView({ block: 'nearest' });
      })
      .catch(function () {
        pending.textContent = 'I could not reach the helper. Check you are online, then ask your teacher.';
      })
      .then(function () { button.disabled = false; });
  }

  document.getElementById('ask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('ask-input');
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    send({ mode: 'learn', question: q }, q, document.getElementById('ask-send'));
  });

  document.getElementById('figma-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('figma-input');
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    send({ mode: 'design', question: q }, q, document.getElementById('figma-send'));
  });

  document.getElementById('debug-send').addEventListener('click', function () {
    var err = document.getElementById('debug-error').value.trim();
    var code = document.getElementById('debug-code').value.trim();
    var server = document.getElementById('debug-server').value.trim();
    var what = document.getElementById('debug-what').value.trim();
    var pick = document.getElementById('debug-story');
    var story = pick && pick.value !== '' ? stories[Number(pick.value)] : '';
    if (!err && !what && !code) {
      bubble('helper', 'Paste what Anvil is telling you, or your code, or describe what it does wrong. Without one of those there is nothing for me to debug, and it is probably a question for the other box.');
      return;
    }
    var shown = (story ? 'For the story: ' + story.split('\\n')[0] + '\\n\\n' : '')
      + (what ? what + '\\n\\n' : '') + (err ? err : '') + (code ? (err ? '\\n\\n' : '') + code : '');
    send({ mode: 'debug', question: what, error: err, code: code, serverCode: server, story: story }, shown, document.getElementById('debug-send'));
  });
})();
</script>`;
}

/**
 * The designers' helper box.
 *
 * One door, not two, because the design side has no lookup chain to protect. A
 * designer asking "can Anvil round the corners of an image" is not skipping a
 * lesson by being told; there is no exercise in not knowing that, and the
 * answer saves them a period of drawing something nobody can build.
 *
 * The refusal here is a different one, and it is on the server: the helper must
 * never invent a component name. Names come off this page, and a helper that
 * makes one up hands the team a design and a code file that disagree.
 */
/**
 * The gap guide's helper.
 *
 * Same shape as the design box, different job and a different refusal. It knows
 * what this team is missing and may say so plainly, because that is the whole
 * page. What it will not do is write the missing thing: a story a model wrote
 * is not the team's story, and they have to defend it in a design review.
 *
 * It also has to be gentle in a way the other boxes do not. This is the box a
 * team opens when they are behind, and a list of what you have not done is a
 * hard thing to read when you are twelve.
 */
function gapAskBox(slug: string): string {
  return `
  <section class="ask" aria-label="Ask what to do next">
    <h2>Ask about any of this</h2>
    <p class="ask-intro">
      Good ones: <em>why does this have to happen before the next bit?</em>
      <em>what does "acceptance criteria" actually mean for our app?</em>
      <em>we disagree about this, what should we think about?</em>
      I have your plan, your stories and this list in front of me. I will not
      write your story or make your team's decision, because those have to be
      yours.
    </p>
    <form id="ask-form">
      <textarea id="ask-input" rows="2" maxlength="600"
        placeholder="What do you want to know?" aria-label="Your question"></textarea>
      <button type="submit" id="ask-send">Ask</button>
    </form>
    <div id="ask-thread" aria-live="polite"></div>
  </section>
<script>
(function () {
  var thread = document.getElementById('ask-thread');
  var history = [];

  function bubble(who, text) {
    var el = document.createElement('div');
    el.className = 'ask-bubble ask-' + who;
    el.textContent = text;
    thread.appendChild(el);
    return el;
  }

  document.getElementById('ask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('ask-input');
    var button = document.getElementById('ask-send');
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    button.disabled = true;
    bubble('you', q);
    var pending = bubble('helper', 'Thinking...');
    fetch('/api/trail-crew/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team: ${JSON.stringify(slug)}, mode: 'gap', question: q, history: history })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var text = data.answer || data.error || 'Something went wrong. Ask your teacher.';
        pending.textContent = text;
        if (data.answer) {
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: data.answer });
          history = history.slice(-6);
        }
      })
      .catch(function () {
        pending.textContent = 'I could not reach the helper. Check you are online, then ask your teacher.';
      })
      .then(function () { button.disabled = false; });
  });
})();
</script>`;
}

function designAskBox(slug: string): string {
  return `
  <section class="ask" aria-label="Ask about your design">
    <h2>Ask about your design</h2>
    <p class="ask-intro">
      Good ones: <em>can Anvil do a card with a shadow?</em>
      <em>Does my design match what my team is building?</em>
      <em>What should the empty state say?</em>
      I have your screens and your component names in front of me.
    </p>
    <form id="ask-form">
      <textarea id="ask-input" rows="2" maxlength="600"
        placeholder="What do you want to know?" aria-label="Your question"></textarea>
      <button type="submit" id="ask-send">Ask</button>
    </form>
    <div id="ask-thread" aria-live="polite"></div>
  </section>
<script>
(function () {
  var thread = document.getElementById('ask-thread');
  var history = [];

  function bubble(who, text) {
    var el = document.createElement('div');
    el.className = 'ask-bubble ask-' + who;
    el.textContent = text;
    thread.appendChild(el);
    return el;
  }

  document.getElementById('ask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('ask-input');
    var button = document.getElementById('ask-send');
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    button.disabled = true;
    bubble('you', q);
    var pending = bubble('helper', 'Thinking...');
    fetch('/api/trail-crew/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team: ${JSON.stringify(slug)}, mode: 'design', question: q, history: history })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var text = data.answer || data.error || 'Something went wrong. Ask your teacher.';
        pending.textContent = text;
        if (data.answer) {
          history.push({ role: 'user', content: q });
          history.push({ role: 'assistant', content: data.answer });
          history = history.slice(-6);
        }
      })
      .catch(function () {
        pending.textContent = 'I could not reach the helper. Check you are online, then ask your teacher.';
      })
      .then(function () { button.disabled = false; });
  });
})();
</script>`;
}

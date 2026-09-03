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
   * The team's stories, so they can propose a change to one.
   *
   * Present only on the build cards page. The card is where a team is standing
   * when they realise their story is wrong, but the story is what actually gets
   * edited, and the form says so, otherwise two copies of the same sentence
   * start drifting apart.
   */
  proposeStories?: Array<{ heading: string; text: string }>;
  /**
   * Set when the team's stories changed after this document was last written.
   *
   * The prototype regenerates itself from the stories; this page does not,
   * because a changed story can change which patterns a feature needs, and that
   * is judgment. Saying so beats quietly serving a build guide that no longer
   * matches the story above it.
   */
  staleSince?: string;
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
hr { border: 0; border-top: 1px solid var(--line); margin: 30px 0; }
.table-scroll { overflow-x: auto; margin: 0 0 18px; }
table { border-collapse: collapse; width: 100%; font-size: .92rem; }
th, td { text-align: left; padding: 8px 11px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { background: rgba(0,0,0,.03); font-family: var(--heading-font); color: var(--primary); }
a { color: var(--accent); }
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
    options.staleSince
      ? `<p class="stale"><strong>Your stories changed on ${escapeHtml(options.staleSince)}.</strong>
          This page has not caught up yet, so check it against your stories before you follow it.
          Your prototype is already up to date.</p>`
      : ""
  }
  <main>
${renderMarkdown(options.markdown)}
  </main>
  ${options.proposeStories && options.proposeStories.length > 0 && options.askForTeam ? proposeBox(options.askForTeam, options.proposeStories) : ""}
  ${options.askForTeam ? askBox(options.askForTeam) : ""}
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
 * The helper box, with two doors.
 *
 * The refusal in learn mode is right because the answer is in their documents
 * and looking it up is the lesson. An error message is the opposite: nothing in
 * the Pattern Book contains their error, so refusing there teaches nothing and
 * leaves a twelve year old staring at red text, which is where students quit.
 *
 * Two labelled boxes rather than a hidden toggle, so a student knows which help
 * they are asking for and why the answers differ. Debug mode is still gated on
 * evidence server side: no error and no description means it is a lookup
 * question and goes back through the mode that teaches.
 */
function askBox(slug: string): string {
  return `
  <section class="ask" aria-label="Ask for help">
    <h2>Stuck?</h2>
    <div class="ask-tabs" role="tablist">
      <button type="button" id="tab-learn" role="tab" aria-selected="true">I do not know what to do</button>
      <button type="button" id="tab-debug" role="tab" aria-selected="false">I tried and it is not working</button>
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
        Something broken is different. Paste what Anvil is telling you and I will
        explain what it means and show you the fix. <strong>You have to have
        tried it first.</strong>
      </p>
      <label class="ask-label" for="debug-error">What Anvil says (paste the red text)</label>
      <textarea id="debug-error" rows="3" maxlength="2500"
        placeholder="AttributeError: 'Form1' object has no attribute ..."></textarea>
      <label class="ask-label" for="debug-code">Your code, if you have it (optional)</label>
      <textarea id="debug-code" rows="4" maxlength="2500"></textarea>
      <label class="ask-label" for="debug-what">What you expected to happen (optional)</label>
      <textarea id="debug-what" rows="2" maxlength="600"
        placeholder="I clicked save and nothing happened"></textarea>
      <button type="button" id="debug-send">Help me fix it</button>
    </div>

    <div id="ask-thread" aria-live="polite"></div>
  </section>
<script>
(function () {
  var tabLearn = document.getElementById('tab-learn');
  var tabDebug = document.getElementById('tab-debug');
  var paneLearn = document.getElementById('pane-learn');
  var paneDebug = document.getElementById('pane-debug');
  var thread = document.getElementById('ask-thread');
  var history = [];

  function selectTab(debug) {
    tabDebug.setAttribute('aria-selected', debug ? 'true' : 'false');
    tabLearn.setAttribute('aria-selected', debug ? 'false' : 'true');
    paneDebug.hidden = !debug;
    paneLearn.hidden = debug;
  }
  tabLearn.addEventListener('click', function () { selectTab(false); });
  tabDebug.addEventListener('click', function () { selectTab(true); });

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
    var pending = bubble('helper', 'Thinking...');
    payload.team = ${JSON.stringify(slug)};
    payload.history = history;
    fetch('/api/trail-crew/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var text = data.answer || data.error || 'Something went wrong. Ask your teacher.';
        pending.textContent = text;
        if (data.answer) {
          history.push({ role: 'user', content: shown });
          history.push({ role: 'assistant', content: data.answer });
          history = history.slice(-6);
        }
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

  document.getElementById('debug-send').addEventListener('click', function () {
    var err = document.getElementById('debug-error').value.trim();
    var code = document.getElementById('debug-code').value.trim();
    var what = document.getElementById('debug-what').value.trim();
    if (!err && !what) {
      bubble('helper', 'Paste what Anvil is telling you, or describe what it does wrong. Without one of those there is nothing for me to debug, and it is probably a question for the other box.');
      return;
    }
    var shown = (what ? what + '\\n\\n' : '') + (err ? err : '');
    send({ mode: 'debug', question: what, error: err, code: code }, shown, document.getElementById('debug-send'));
  });
})();
</script>`;
}

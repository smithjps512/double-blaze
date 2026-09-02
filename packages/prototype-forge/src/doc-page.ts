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
.ask { margin-top: 24px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px 22px; }
.ask h2 { font-family: var(--heading-font); font-size: 1.15rem; margin: 0 0 4px; color: var(--primary); border: 0; padding: 0; }
.ask-intro { font-size: .88rem; color: var(--muted); margin: 0 0 14px; }
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
  <main>
${renderMarkdown(options.markdown)}
  </main>
  ${options.askForTeam ? askBox(options.askForTeam) : ""}
  <p class="credit"><a href="${escapeHtml(creditHref)}">${escapeHtml(credit)}</a></p>
</div>
</body>
</html>
`;
}

/**
 * The helper box.
 *
 * It says up front that it will not give them code, because a student who
 * discovers that after three attempts feels tricked, and one who is told first
 * uses it for what it is good at.
 */
function askBox(slug: string): string {
  return `
  <section class="ask" aria-label="Ask for help">
    <h2>Stuck?</h2>
    <p class="ask-intro">
      Ask and I will tell you which page and which pattern answers it.
      I will not write the code for you, because finding it is the part that
      makes you able to do it next time.
    </p>
    <form id="ask-form">
      <textarea id="ask-input" rows="2" maxlength="600"
        placeholder="What are you stuck on?" aria-label="Your question"></textarea>
      <button type="submit" id="ask-send">Ask</button>
    </form>
    <div id="ask-thread" aria-live="polite"></div>
  </section>
<script>
(function () {
  var form = document.getElementById('ask-form');
  var input = document.getElementById('ask-input');
  var send = document.getElementById('ask-send');
  var thread = document.getElementById('ask-thread');
  var history = [];

  function bubble(who, text) {
    var el = document.createElement('div');
    el.className = 'ask-bubble ask-' + who;
    el.textContent = text;
    thread.appendChild(el);
    return el;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var question = input.value.trim();
    if (!question) return;
    input.value = '';
    send.disabled = true;
    bubble('you', question);
    var pending = bubble('helper', 'Thinking...');

    fetch('/api/trail-crew/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ team: ${JSON.stringify(slug)}, question: question, history: history })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var text = data.answer || data.error || 'Something went wrong. Ask your teacher.';
        pending.textContent = text;
        if (data.answer) {
          history.push({ role: 'user', content: question });
          history.push({ role: 'assistant', content: data.answer });
          history = history.slice(-6);
        }
      })
      .catch(function () {
        pending.textContent = 'I could not reach the helper. Check you are online, then ask your teacher.';
      })
      .then(function () { send.disabled = false; input.focus(); });
  });
})();
</script>`;
}

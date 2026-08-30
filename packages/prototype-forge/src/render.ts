/**
 * Renders a prototype plan to one self-contained HTML file.
 *
 * No build step, no framework, no external request. A student can open the file
 * from a thumb drive, a teacher can attach it to an assignment, and it renders
 * the same in a school Chromebook as it does on the gallery. That constraint is
 * why the CSS is inlined and the only script is the few lines needed to switch
 * screens.
 *
 * The renderer owns every tag. Nothing a student typed reaches the page as
 * markup, so a stray angle bracket in a user story cannot break a prototype or
 * inject anything into the gallery that shows it.
 */

import type { AppSpec, CoachNote, ElementSpec, ScreenSpec } from "./types";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

function renderElement(el: ElementSpec): string {
  switch (el.kind) {
    case "heading":
      return `<h2 class="el-heading">${escapeHtml(el.text)}</h2>`;

    case "text":
      return `<p class="el-text">${escapeHtml(el.text)}</p>`;

    case "list":
      return [
        `<div class="el-list">`,
        el.heading ? `<h3>${escapeHtml(el.heading)}</h3>` : "",
        `<ul>${el.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`,
        `</div>`,
      ].join("");

    case "card": {
      const inner = [
        `<span class="card-title">${escapeHtml(el.title)}</span>`,
        el.body ? `<span class="card-body">${escapeHtml(el.body)}</span>` : "",
        el.meta ? `<span class="card-meta">${escapeHtml(el.meta)}</span>` : "",
      ].join("");
      if (el.to) {
        return `<button class="el-card is-link" data-goto="${escapeHtml(el.to)}">${inner}<span class="card-chevron" aria-hidden="true">&rsaquo;</span></button>`;
      }
      return `<div class="el-card">${inner}</div>`;
    }

    case "button": {
      const cls = el.primary ? "el-button is-primary" : "el-button";
      if (el.to) return `<button class="${cls}" data-goto="${escapeHtml(el.to)}">${escapeHtml(el.label)}</button>`;
      return [
        `<div class="el-action">`,
        `<button class="${cls}" data-says="${escapeHtml(el.says ?? "")}">${escapeHtml(el.label)}</button>`,
        `<p class="el-flash" hidden></p>`,
        `</div>`,
      ].join("");
    }

    case "field": {
      // Unique per document: a duplicated id would silently detach a label
      // from its control, which is exactly the accessibility bug a generated
      // page should never ship.
      fieldSeq += 1;
      const id = `f-${fieldSeq}-${Math.abs(hash(el.label)).toString(36)}`;
      const label = `<label class="el-field-label" for="${id}">${escapeHtml(el.label)}</label>`;
      let control: string;
      if (el.control === "textarea") control = `<textarea id="${id}" rows="3" placeholder="Type here"></textarea>`;
      else if (el.control === "select") {
        const options = (el.options && el.options.length > 0 ? el.options : ["Choose one", "Another option"])
          .map((o) => `<option>${escapeHtml(o)}</option>`)
          .join("");
        control = `<select id="${id}">${options}</select>`;
      } else if (el.control === "date") control = `<input id="${id}" type="date" />`;
      else if (el.control === "toggle") control = `<input id="${id}" type="checkbox" class="el-toggle" />`;
      else control = `<input id="${id}" type="text" placeholder="Type here" />`;
      return `<div class="el-field">${label}${control}</div>`;
    }

    case "stat":
      return `<div class="el-stat"><span class="stat-value">${escapeHtml(el.value)}</span><span class="stat-label">${escapeHtml(el.label)}</span></div>`;

    case "note":
      return `<p class="el-note">${escapeHtml(el.text)}</p>`;

    default:
      return "";
  }
}

/** Reset per document by renderPrototype, so ids are stable across renders. */
let fieldSeq = 0;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function renderScreen(screen: ScreenSpec, index: number): string {
  const stats = screen.elements.filter((e) => e.kind === "stat");
  const rest = screen.elements.filter((e) => e.kind !== "stat");
  const statRow = stats.length > 0 ? `<div class="stat-row">${stats.map(renderElement).join("")}</div>` : "";
  return [
    `<section class="screen" id="screen-${escapeHtml(screen.id)}" data-roles="${escapeHtml(screen.roles.join("|"))}"${index === 0 ? "" : " hidden"}>`,
    `<header class="screen-head">`,
    `<h1>${escapeHtml(screen.title)}</h1>`,
    screen.subtitle ? `<p class="screen-sub">${escapeHtml(screen.subtitle)}</p>` : "",
    `</header>`,
    statRow,
    rest.map(renderElement).join(""),
    `</section>`,
  ].join("");
}

// ---------------------------------------------------------------------------
// Coach panel
// ---------------------------------------------------------------------------

const NOTE_LABEL: Record<CoachNote["level"], string> = {
  gap: "Fill this in",
  tip: "Worth a look",
  win: "Nice work",
};

function renderNotes(notes: CoachNote[]): string {
  if (notes.length === 0) {
    return `<p class="coach-empty">No notes. Your documents covered everything this generator looks for.</p>`;
  }
  const order: CoachNote["level"][] = ["gap", "tip", "win"];
  return order
    .map((level) => {
      const group = notes.filter((n) => n.level === level);
      if (group.length === 0) return "";
      return [
        `<h3 class="coach-group coach-${level}">${escapeHtml(NOTE_LABEL[level])}</h3>`,
        `<ul class="coach-list">`,
        group
          .map(
            (n) =>
              `<li class="coach-item coach-${level}">${n.where ? `<span class="coach-where">${escapeHtml(n.where)}</span>` : ""}${escapeHtml(n.message)}</li>`,
          )
          .join(""),
        `</ul>`,
      ].join("");
    })
    .join("");
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

export interface RenderOptions {
  /** Shown in the frame footer. Defaults to the Double Blaze credit. */
  credit?: string;
  /** Link the credit points at. */
  creditHref?: string;
}

export function renderPrototype(app: AppSpec, options: RenderOptions = {}): string {
  fieldSeq = 0;
  const t = app.theme;
  const navScreens = app.screens.filter((s) => s.inNav);
  const offNav = app.screens.filter((s) => !s.inNav);
  const credit = options.credit ?? "Built in class with Double Blaze";
  const creditHref = options.creditHref ?? "https://doubleblaze.solutions";
  const gapCount = app.notes.filter((n) => n.level === "gap").length;

  const roleOptions = [
    `<option value="">Everyone</option>`,
    ...app.viewAs.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
  ].join("");

  const title = app.teamName ? `${app.productName} by ${app.teamName}` : app.productName;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)}</title>
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
body {
  margin: 0;
  font-family: var(--body-font);
  color: var(--text);
  background: #eeeae5;
  line-height: 1.5;
}
.page { max-width: 1180px; margin: 0 auto; padding: 24px 16px 64px; }
.masthead { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.masthead h1 { font-family: var(--heading-font); font-size: 1.6rem; margin: 0; color: var(--primary); }
.masthead .team { color: var(--muted); font-size: .95rem; margin: 4px 0 0; }
.controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.controls label { font-size: .8rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.controls select, .controls button {
  font: inherit; font-size: .9rem; padding: 7px 12px; border-radius: 8px;
  border: 1px solid var(--line); background: #fff; color: var(--text); cursor: pointer;
}
.controls button[aria-pressed="true"] { background: var(--primary); color: #fff; border-color: var(--primary); }
.badge { display: inline-block; min-width: 20px; text-align: center; margin-left: 6px; padding: 0 6px; border-radius: 999px; background: var(--accent); color: #fff; font-size: .78rem; }

.layout { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 24px; align-items: start; }
.layout.coach-closed { grid-template-columns: minmax(0,1fr); }
.layout.coach-closed .coach { display: none; }

.device {
  background: #fff; border: 1px solid var(--line); border-radius: 18px; overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,.10); display: flex; flex-direction: column; min-height: 560px;
}
.device-bar { background: var(--primary); color: #fff; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.device-bar .app-name { font-family: var(--heading-font); font-weight: 700; }
.device-bar .role-tag { font-size: .8rem; opacity: .85; }
.device-body { padding: 22px 20px 28px; background: var(--surface); flex: 1; }

.tabs { display: flex; flex-wrap: wrap; gap: 4px; border-top: 1px solid var(--line); background: #fff; padding: 8px; }
.tabs button {
  font: inherit; font-size: .85rem; padding: 8px 12px; border-radius: 8px; border: 0;
  background: transparent; color: var(--muted); cursor: pointer;
}
.tabs button[aria-current="true"] { background: var(--primary); color: #fff; }
.tabs button[hidden] { display: none; }

.screen-head h1 { font-family: var(--heading-font); font-size: 1.5rem; margin: 0 0 2px; color: var(--primary); }
.screen-sub { margin: 0 0 14px; color: var(--accent); font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; }
.el-heading { font-family: var(--heading-font); font-size: 1.25rem; margin: 20px 0 6px; }
.el-text { margin: 0 0 14px; }
.el-note {
  margin: 0 0 14px; padding: 10px 12px; border-left: 3px solid var(--accent);
  background: rgba(0,0,0,.03); color: var(--muted); font-size: .92rem;
}
.el-list { margin: 0 0 16px; }
.el-list h3 { font-size: .95rem; margin: 0 0 6px; }
.el-list ul { margin: 0; padding-left: 20px; }
.el-list li { margin-bottom: 4px; font-size: .92rem; color: var(--muted); }

.el-card {
  display: flex; flex-direction: column; gap: 3px; width: 100%; text-align: left;
  padding: 14px 16px; margin-bottom: 10px; border: 1px solid var(--line);
  border-radius: 12px; background: #fff; font: inherit; color: inherit; position: relative;
}
.el-card.is-link { cursor: pointer; padding-right: 34px; }
.el-card.is-link:hover { border-color: var(--primary); }
.card-title { font-weight: 600; }
.card-body { font-size: .92rem; color: var(--muted); }
.card-meta { font-size: .78rem; color: var(--accent); text-transform: uppercase; letter-spacing: .05em; }
.card-chevron { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 1.4rem; color: var(--muted); }

.el-action { margin-bottom: 12px; }
.el-button {
  font: inherit; font-size: .95rem; padding: 10px 16px; border-radius: 10px;
  border: 1px solid var(--primary); background: #fff; color: var(--primary); cursor: pointer;
}
.el-button.is-primary { background: var(--primary); color: #fff; }
.el-button:hover { filter: brightness(1.08); }
.el-flash {
  margin: 8px 0 0; padding: 10px 12px; border-radius: 8px;
  background: rgba(0,0,0,.05); font-size: .9rem; color: var(--text);
}
.el-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.el-field-label { font-size: .85rem; font-weight: 600; }
.el-field input, .el-field select, .el-field textarea {
  font: inherit; padding: 9px 11px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--text);
}
.el-field input.el-toggle { width: 42px; }

.stat-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
.el-stat { flex: 1 1 120px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.stat-value { display: block; font-family: var(--heading-font); font-size: 1.6rem; color: var(--primary); }
.stat-label { display: block; font-size: .78rem; color: var(--muted); }

.coach { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; position: sticky; top: 24px; }
.coach h2 { font-family: var(--heading-font); font-size: 1.1rem; margin: 0 0 4px; color: var(--primary); }
.coach .coach-intro { font-size: .85rem; color: var(--muted); margin: 0 0 14px; }
.coach-group { font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; margin: 16px 0 6px; }
.coach-group.coach-gap { color: var(--accent); }
.coach-group.coach-tip { color: var(--primary); }
.coach-group.coach-win { color: #15803d; }
.coach-list { list-style: none; margin: 0; padding: 0; }
.coach-item { font-size: .9rem; margin-bottom: 10px; padding-left: 12px; border-left: 3px solid var(--line); }
.coach-item.coach-gap { border-left-color: var(--accent); }
.coach-item.coach-win { border-left-color: #15803d; }
.coach-where { display: block; font-size: .74rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.coach-empty { font-size: .9rem; color: var(--muted); }

.credit { margin-top: 22px; text-align: center; font-size: .82rem; color: var(--muted); }
.credit a { color: var(--muted); }

@media (max-width: 880px) {
  .layout, .layout.coach-closed { grid-template-columns: minmax(0,1fr); }
  .coach { position: static; }
}
</style>
</head>
<body>
<div class="page">
  <div class="masthead">
    <div>
      <h1>${escapeHtml(app.productName)}</h1>
      <p class="team">${escapeHtml(app.teamName ? `A prototype by ${app.teamName}` : "A prototype built from a product plan and user stories")}</p>
    </div>
    <div class="controls">
      <label for="role-select">View as</label>
      <select id="role-select">${roleOptions}</select>
      <button id="coach-toggle" aria-pressed="true">Coach notes<span class="badge">${gapCount}</span></button>
    </div>
  </div>

  <div class="layout" id="layout">
    <div class="device">
      <div class="device-bar">
        <span class="app-name">${escapeHtml(app.productName)}</span>
        <span class="role-tag" id="role-tag">Everyone</span>
      </div>
      <div class="device-body">
        ${app.screens.map((s, i) => renderScreen(s, i)).join("\n")}
      </div>
      <nav class="tabs" aria-label="Screens">
        ${navScreens.map((s) => `<button data-goto="${escapeHtml(s.id)}" data-roles="${escapeHtml(s.roles.join("|"))}">${escapeHtml(s.title)}</button>`).join("")}
        ${offNav.length > 0 ? `<button data-goto="${escapeHtml(offNav[0].id)}" data-roles="">More ideas</button>` : ""}
      </nav>
    </div>

    <aside class="coach" id="coach">
      <h2>Coach notes</h2>
      <p class="coach-intro">This prototype was generated from your plan and your stories, with nothing invented. Anything missing below is missing from your documents.</p>
      ${renderNotes(app.notes)}
    </aside>
  </div>

  <p class="credit"><a href="${escapeHtml(creditHref)}">${escapeHtml(credit)}</a></p>
</div>

<script>
(function () {
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  var roleSelect = document.getElementById('role-select');
  var roleTag = document.getElementById('role-tag');
  var layout = document.getElementById('layout');
  var coachToggle = document.getElementById('coach-toggle');

  function show(id) {
    var found = false;
    screens.forEach(function (s) {
      var match = s.id === 'screen-' + id;
      s.hidden = !match;
      if (match) found = true;
    });
    tabs.forEach(function (t) {
      t.setAttribute('aria-current', t.getAttribute('data-goto') === id ? 'true' : 'false');
    });
    if (found) {
      document.querySelectorAll('.el-flash').forEach(function (f) { f.hidden = true; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-goto], [data-says]') : null;
    if (!el) return;
    var goto = el.getAttribute('data-goto');
    if (goto) { show(goto); return; }
    var says = el.getAttribute('data-says');
    if (says !== null) {
      var flash = el.parentElement.querySelector('.el-flash');
      if (flash) { flash.textContent = says; flash.hidden = false; }
    }
  });

  function applyRole() {
    var role = roleSelect.value;
    roleTag.textContent = role || 'Everyone';
    var firstVisible = null;
    tabs.forEach(function (t) {
      var roles = (t.getAttribute('data-roles') || '').split('|').filter(Boolean);
      var visible = !role || roles.length === 0 || roles.indexOf(role) !== -1;
      t.hidden = !visible;
      if (visible && !firstVisible) firstVisible = t.getAttribute('data-goto');
    });
    var current = tabs.filter(function (t) { return t.getAttribute('aria-current') === 'true'; })[0];
    if ((!current || current.hidden) && firstVisible) show(firstVisible);
  }

  roleSelect.addEventListener('change', applyRole);
  coachToggle.addEventListener('click', function () {
    var open = coachToggle.getAttribute('aria-pressed') === 'true';
    coachToggle.setAttribute('aria-pressed', open ? 'false' : 'true');
    layout.classList.toggle('coach-closed', open);
  });

  applyRole();
  show(${JSON.stringify(app.screens[0]?.id ?? "home")});
})();
</script>
</body>
</html>
`;
}

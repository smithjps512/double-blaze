/**
 * Block renderer: turns structured site content into standalone static HTML.
 *
 * This is the half of the system that makes a paid site maintainable. The
 * legacy Trailhead renderer takes model-authored HTML and wraps chrome around
 * it, which means the markup is whatever the model felt like emitting. Here the
 * renderer owns every tag, so output is consistent, accessible, and safe no
 * matter who authored the content, and a theme change restyles every page at
 * once.
 *
 * Output stays a self-contained document with inlined CSS and no JavaScript, so
 * a rendered page can be written to object storage and served straight from a
 * CDN, and the export bundle is byte-identical to what the world sees.
 */

import type {
  Block,
  Cta,
  LinkStyle,
  SiteContent,
  SitePage,
  SiteTheme,
} from "@double-blaze/site-schema";
import type { RenderedPage } from "./index";

/**
 * Everything the renderer needs that is not the content itself.
 *
 * `assetUrl` is injected rather than imported because asset URLs differ by
 * context: a live page points at storage, an export bundle points at a relative
 * file beside the HTML. The renderer should not know which it is producing.
 */
export interface RenderContext {
  linkStyle: LinkStyle;
  /** Token-scoped preview links, when linkStyle is "preview". */
  token?: string;
  assetUrl?: (assetId: string) => string | null;
}

export const DEFAULT_THEME: SiteTheme = {
  colors: {
    background: "#ffffff",
    text: "#1c1a19",
    primary: "#630031",
    accent: "#cf4420",
    muted: "#75787b",
  },
  fonts: {
    body: "system-ui, -apple-system, sans-serif",
    heading: "Georgia, serif",
  },
};

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Only allow href schemes that cannot execute script.
 *
 * Content is staff and model authored rather than attacker supplied, so this is
 * defense in depth rather than the only thing standing between a visitor and a
 * payload. It costs nothing and removes a whole category of mistake, including
 * the one where a model helpfully writes a `javascript:` link.
 */
export function safeHref(href: string): string {
  const trimmed = href.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("?") ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  ) {
    return trimmed;
  }
  // Anything else (javascript:, data:, vbscript:, a bare scheme) becomes inert.
  return "#";
}

// ---------------------------------------------------------------------------
// Minimal markdown
// ---------------------------------------------------------------------------

/**
 * A deliberately small markdown subset: headings, bold, italic, links, code,
 * unordered lists, and paragraphs.
 *
 * Hand-rolled rather than pulling in a parser, matching how the export route
 * builds a zip without a dependency. The order matters for safety: the input is
 * HTML-escaped *first*, so any markup in the source becomes text, and only then
 * are the handful of known patterns turned back into tags. There is no path by
 * which authored angle brackets survive as markup.
 */
export function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md);
  const blocks = escaped.split(/\n{2,}/);
  const out: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const heading = /^(#{1,4})\s+(.*)$/.exec(block);
    if (heading) {
      const level = heading[1].length + 1; // h1 is the page title, so start at h2
      const tag = `h${Math.min(level, 6)}`;
      out.push(`<${tag}>${inline(heading[2])}</${tag}>`);
      continue;
    }

    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = lines
        .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
        .join("\n    ");
      out.push(`<ul>\n    ${items}\n  </ul>`);
      continue;
    }

    out.push(`<p>${inline(lines.join("<br>"))}</p>`);
  }

  return out.join("\n  ");
}

function inline(s: string): string {
  return (
    s
      // Links first, so emphasis inside a label still works and the URL is
      // scheme-checked before anything else touches it.
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
        const safe = safeHref(unescapeForHref(href));
        return `<a href="${escapeAttr(safe)}">${label}</a>`;
      })
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
  );
}

/** hrefs were HTML-escaped with the rest of the text; undo that before checking. */
function unescapeForHref(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function renderCta(cta: Cta | undefined, ctx: RenderContext): string {
  if (!cta?.label) return "";
  const href = resolveHref(cta.href, ctx);
  return `\n      <p class="cta"><a href="${escapeAttr(href)}">${escapeHtml(cta.label)}</a></p>`;
}

/**
 * Internal links are written as bare page slugs by authors and by Spark, so
 * they are mapped onto whatever form the current serving context uses. External
 * links, mail, and telephone pass through the scheme check unchanged.
 */
function resolveHref(href: string, ctx: RenderContext): string {
  const raw = (href ?? "").trim();
  if (!raw) return "#";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//") || raw.startsWith("#")) {
    return safeHref(raw);
  }
  const slug = raw.replace(/^\.?\//, "").replace(/\.html$/i, "").replace(/\/+$/, "");
  return pageHref(slug || "home", ctx);
}

export function pageHref(slug: string, ctx: RenderContext): string {
  const isHome = slug === "home" || slug === "" || slug === "index";
  switch (ctx.linkStyle) {
    case "live":
      return isHome ? "/" : `/${slug}`;
    case "preview":
      return isHome
        ? `/api/sites/preview/${ctx.token ?? ""}`
        : `/api/sites/preview/${ctx.token ?? ""}?page=${encodeURIComponent(slug)}`;
    case "export":
    default:
      return isHome ? "/index.html" : `/${slug}.html`;
  }
}

function media(assetId: string, alt: string | undefined, ctx: RenderContext): string {
  const url = ctx.assetUrl?.(assetId);
  // A missing asset renders nothing rather than a broken image. An unresolvable
  // reference is a content problem to surface in the editor, not something to
  // show a visitor.
  if (!url) return "";
  return `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt ?? "")}" loading="lazy">`;
}

function heading(text: string | undefined): string {
  return text ? `\n      <h2>${escapeHtml(text)}</h2>` : "";
}

export function renderBlock(block: Block, ctx: RenderContext): string {
  switch (block.type) {
    case "hero": {
      const img = block.media ? media(block.media.assetId, block.media.alt, ctx) : "";
      return `<section class="block hero">${
        block.eyebrow ? `\n      <p class="eyebrow">${escapeHtml(block.eyebrow)}</p>` : ""
      }
      <h1>${escapeHtml(block.heading)}</h1>${
        block.sub ? `\n      <p class="sub">${escapeHtml(block.sub)}</p>` : ""
      }${img ? `\n      ${img}` : ""}${renderCta(block.cta, ctx)}
    </section>`;
    }

    case "prose":
      return `<section class="block prose">
      ${renderMarkdown(block.markdown)}
    </section>`;

    case "cards": {
      const items = block.items
        .map((card) => {
          const img = card.media ? media(card.media.assetId, card.media.alt, ctx) : "";
          return `<li class="card">${img ? `\n        ${img}` : ""}
        <h3>${escapeHtml(card.title)}</h3>${
          card.body ? `\n        <p>${escapeHtml(card.body)}</p>` : ""
        }${renderCta(card.cta, ctx)}
      </li>`;
        })
        .join("\n      ");
      return `<section class="block cards">${heading(block.heading)}
      <ul class="card-grid">
      ${items}
      </ul>
    </section>`;
    }

    case "gallery": {
      const figures = block.assets
        .map((a) => {
          const img = media(a.assetId, a.alt, ctx);
          return img ? `<li>${img}</li>` : "";
        })
        .filter(Boolean)
        .join("\n      ");
      if (!figures) return "";
      return `<section class="block gallery">${heading(block.heading)}
      <ul class="gallery-grid">
      ${figures}
      </ul>
    </section>`;
    }

    case "roster":
      // Rendered empty at build time and filled by the member application at
      // request time. A static page cannot know who is a member, and baking a
      // roster into a cached artifact would leak stale membership.
      return `<section class="block roster" data-source="${escapeAttr(block.source)}" data-fields="${escapeAttr(block.fields.join(","))}">${heading(block.heading)}
      <p class="placeholder">Member directory</p>
    </section>`;

    case "events":
      return `<section class="block events" data-source="${escapeAttr(block.source)}" data-limit="${block.limit}">${heading(block.heading)}
      <p class="placeholder">Upcoming events</p>
    </section>`;

    case "form": {
      const fields = block.fields
        .map((f) => {
          const id = `f-${escapeAttr(f.key)}`;
          const required = f.required ? " required" : "";
          const control =
            f.type === "textarea"
              ? `<textarea id="${id}" name="${escapeAttr(f.key)}"${required}></textarea>`
              : f.type === "select"
                ? `<select id="${id}" name="${escapeAttr(f.key)}"${required}>${(f.options ?? [])
                    .map((o) => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`)
                    .join("")}</select>`
                : `<input id="${id}" name="${escapeAttr(f.key)}" type="${escapeAttr(f.type)}"${required}>`;
          return `<p class="field">
        <label for="${id}">${escapeHtml(f.label)}</label>
        ${control}
      </p>`;
        })
        .join("\n      ");
      return `<section class="block form">${heading(block.heading)}
      <form method="post" action="/api/sites/forms/${escapeAttr(block.formKey)}">
      ${fields}
        <p><button type="submit">Send</button></p>
      </form>
    </section>`;
    }

    case "members_only":
      // The gate is enforced by the member application, never by hiding markup.
      // Nothing inside is emitted into a public artifact.
      return `<section class="block members-only" data-gate="members">
      <p class="placeholder">Members only</p>
    </section>`;

    case "html":
      // Staff authored, passed through verbatim. This is the escape hatch, and
      // it is the one place the renderer does not own the markup.
      return `<section class="block raw">${block.html}</section>`;

    case "split": {
      const img = block.media ? media(block.media.assetId, block.media.alt, ctx) : "";
      const side = block.mediaSide === "left" ? " media-left" : "";
      return `<section class="block split${side}">
      <div class="split-media">${img}</div>
      <div class="split-body">${
        block.eyebrow ? `\n        <p class="eyebrow">${escapeHtml(block.eyebrow)}</p>` : ""
      }
        <h2>${escapeHtml(block.heading)}</h2>
        ${renderMarkdown(block.body)}${renderCta(block.cta, ctx)}
      </div>
    </section>`;
    }

    case "steps": {
      // Numbered by the list itself rather than by baked-in text, so reordering
      // steps in the editor cannot leave the numbers wrong.
      const items = block.items
        .map(
          (item) => `<li>
        <h3>${escapeHtml(item.title)}</h3>${
          item.body ? `\n        <p>${escapeHtml(item.body)}</p>` : ""
        }
      </li>`,
        )
        .join("\n      ");
      return `<section class="block steps">${heading(block.heading)}${
        block.intro ? `\n      <p class="intro">${escapeHtml(block.intro)}</p>` : ""
      }
      <ol class="step-list">
      ${items}
      </ol>
    </section>`;
    }

    case "cta":
      return `<section class="block cta-band">
      <div class="cta-inner">
        <h2>${escapeHtml(block.heading)}</h2>${
          block.body ? `\n        <p>${escapeHtml(block.body)}</p>` : ""
        }${renderCta(block.cta, ctx)}${
          block.note ? `\n        <p class="note">${escapeHtml(block.note)}</p>` : ""
        }
      </div>
    </section>`;

    default: {
      // An unknown block type means content newer than this renderer. Skip it
      // rather than throwing: one unrecognized block should not take the page
      // down.
      const _exhaustive: never = block;
      void _exhaustive;
      return "";
    }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function stylesheet(theme: SiteTheme): string {
  const c = theme.colors;
  return `:root {
  --bg: ${c.background};
  --text: ${c.text};
  --primary: ${c.primary};
  --accent: ${c.accent};
  --muted: ${c.muted};
  --font-body: ${theme.fonts.body};
  --font-heading: ${theme.fonts.heading};
  --surface: color-mix(in srgb, var(--primary) 4%, var(--bg));
  --line: color-mix(in srgb, var(--primary) 14%, transparent);
  --radius: 14px;
  --measure: 62ch;
  --pad: clamp(3rem, 8vw, 6.5rem);
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
h1, h2, h3 {
  font-family: var(--font-heading);
  color: var(--primary);
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-wrap: balance;
}
h1 { font-size: clamp(2.4rem, 6vw, 4.1rem); margin: 0 0 1rem; }
h2 { font-size: clamp(1.7rem, 3.4vw, 2.5rem); margin: 0 0 1rem; }
h3 { font-size: 1.15rem; margin: 0 0 0.4rem; }
p { margin: 0 0 1rem; max-width: var(--measure); }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 3px; }

/* Eyebrow: the small label above a heading that orients the reader in one
   glance without spending a sentence on it. */
.eyebrow {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.75rem;
}

/* Layout */
main { display: block; }
.block { padding: var(--pad) 1.5rem; }
.block > *, .block-inner { max-width: 68rem; margin-inline: auto; }
.block + .block { padding-top: 0; }

/* Header */
header.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
nav.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  max-width: 68rem;
  margin-inline: auto;
  padding: 1rem 1.5rem;
}
nav.site-nav .site-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--primary);
  margin-right: auto;
  letter-spacing: -0.01em;
}
nav.site-nav a {
  color: var(--text);
  text-decoration: none;
  font-size: 0.95rem;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
}
nav.site-nav a:hover { border-bottom-color: var(--line); }
nav.site-nav a.active { border-bottom-color: var(--accent); font-weight: 600; }

/* Buttons */
.cta a {
  display: inline-block;
  padding: 0.85rem 1.75rem;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius);
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
.cta a:hover { filter: brightness(0.93); }
.cta { margin-top: 1.75rem; }

/* Hero */
.block.hero {
  padding-top: clamp(3.5rem, 9vw, 7rem);
  background:
    radial-gradient(120% 90% at 88% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 62%),
    radial-gradient(90% 80% at 0% 10%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 60%);
}
.block.hero .sub {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  color: var(--muted);
  max-width: 46ch;
  margin-bottom: 0;
}
.block.hero img {
  margin-top: 3rem;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  width: 100%;
}

/* Split */
.split { }
.split .block-inner,
.split-media, .split-body { }
.block.split {
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
  grid-template-columns: 1fr;
}
.block.split > * { max-width: none; }
.split-media img { border-radius: var(--radius); border: 1px solid var(--line); width: 100%; }
.split-media:empty { display: none; }
@media (min-width: 52rem) {
  .block.split {
    grid-template-columns: 1fr 1fr;
    max-width: 68rem;
    margin-inline: auto;
  }
  .block.split.media-left .split-media { order: -1; }
  .block.split:not(.media-left) .split-media { order: 1; }
}

/* Cards */
.card-grid, .gallery-grid {
  list-style: none;
  margin: 2rem 0 0;
  padding: 0;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.75rem;
}
.card img { border-radius: 8px; margin-bottom: 1rem; }
.card p { margin-bottom: 0; color: var(--muted); font-size: 0.97rem; }
.card .cta { margin-top: 1rem; }
.card .cta a { background: none; color: var(--accent); padding: 0; box-shadow: none; text-decoration: underline; }

/* Gallery */
.gallery-grid { list-style: none; }
.gallery-grid img { border-radius: var(--radius); border: 1px solid var(--line); }

/* Steps: numbered by counter so reordering cannot leave the numbers wrong. */
.step-list {
  list-style: none;
  counter-reset: step;
  margin: 2.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 1.75rem;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}
.step-list li { counter-increment: step; position: relative; padding-top: 3.25rem; }
.step-list li::before {
  content: counter(step);
  position: absolute;
  top: 0;
  left: 0;
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--primary);
  color: var(--bg);
  font-family: var(--font-heading);
  font-weight: 700;
}
.step-list p { color: var(--muted); font-size: 0.97rem; margin-bottom: 0; }
.steps .intro { color: var(--muted); }

/* Closing CTA band */
.block.cta-band { padding-inline: 1.5rem; }
.cta-inner {
  max-width: 68rem;
  margin-inline: auto;
  background: var(--primary);
  color: var(--bg);
  border-radius: calc(var(--radius) * 1.5);
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 4rem);
  text-align: center;
}
.cta-inner h2 { color: var(--bg); margin-bottom: 0.75rem; }
.cta-inner p { color: color-mix(in srgb, var(--bg) 82%, var(--primary)); margin-inline: auto; }
.cta-inner .cta a { background: var(--bg); color: var(--primary); }
.cta-inner .note { font-size: 0.88rem; margin: 1.25rem 0 0; }

/* Prose */
.prose ul { max-width: var(--measure); padding-left: 1.25rem; }
.prose li { margin-bottom: 0.4rem; }
.prose code {
  background: var(--surface);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

/* Forms */
.form form { max-width: 34rem; margin-top: 2rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem; }
.field label { font-weight: 600; font-size: 0.92rem; }
.field input, .field textarea, .field select {
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  font: inherit;
  background: var(--bg);
  color: var(--text);
}
.field textarea { min-height: 8rem; resize: vertical; }
button {
  padding: 0.85rem 1.75rem;
  background: var(--primary);
  color: var(--bg);
  border: 0;
  border-radius: var(--radius);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

/* Footer */
footer.site-footer {
  border-top: 1px solid var(--line);
  padding: 3rem 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--muted);
}
footer.site-footer p { max-width: none; margin: 0 0 0.5rem; }
footer.site-footer a { color: inherit; }

.placeholder { color: var(--muted); font-style: italic; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { animation: none !important; transition: none !important; }
}`;
}

/**
 * Render one page of block content to a complete HTML document.
 *
 * Returns null for an out-of-range index so a caller iterating pages cannot
 * accidentally emit a document for a page that does not exist.
 */
export function renderSitePage(
  content: SiteContent,
  pageIndex: number,
  ctx: RenderContext,
): RenderedPage | null {
  const page: SitePage | undefined = content.pages[pageIndex];
  if (!page) return null;

  const theme = content.theme ?? DEFAULT_THEME;
  const navItems = content.pages
    .filter((p) => p.inNav !== false)
    .map((p) => {
      const active = p.slug === page.slug ? ' class="active"' : "";
      return `<a href="${escapeAttr(pageHref(p.slug, ctx))}"${active}>${escapeHtml(p.title)}</a>`;
    })
    .join("\n      ");

  const body = page.blocks
    .map((b) => renderBlock(b, ctx))
    .filter(Boolean)
    .join("\n    ");

  const credit = content.footerCredit
    ? `\n    <p><a href="https://doubleblaze.solutions">Built by Double Blaze</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} | ${escapeHtml(content.siteName)}</title>${
    content.tagline
      ? `\n  <meta name="description" content="${escapeAttr(content.tagline)}">`
      : ""
  }
  <style>
${stylesheet(theme)}
  </style>
</head>
<body>
  <header class="site-header">
    <nav class="site-nav" aria-label="Main navigation">
      <span class="site-name">${escapeHtml(content.siteName)}</span>
      ${navItems}
    </nav>
  </header>

  <main>
    ${body}
  </main>

  <footer class="site-footer">
    <p>${escapeHtml(content.siteName)}</p>${credit}
  </footer>
</body>
</html>`;

  return {
    slug: page.slug,
    filename: page.slug === "home" ? "index.html" : `${page.slug}.html`,
    title: page.title,
    html,
  };
}

/** Render every page. This is what publishing writes to storage. */
export function renderSite(
  content: SiteContent,
  ctx: RenderContext,
): RenderedPage[] {
  const pages: RenderedPage[] = [];
  for (let i = 0; i < content.pages.length; i++) {
    const rendered = renderSitePage(content, i, ctx);
    if (rendered) pages.push(rendered);
  }
  return pages;
}

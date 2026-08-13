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
      return `<section class="block hero">
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
}
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.6;
}
h1, h2, h3 { font-family: var(--font-heading); color: var(--primary); line-height: 1.2; }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--accent); }
main { max-width: 68rem; margin: 0 auto; padding: 0 1.25rem; }
.block { padding: 2.5rem 0; }
.block.hero h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 0.5rem; }
.block.hero .sub { font-size: 1.125rem; color: var(--muted); margin: 0 0 1.5rem; }
.cta a {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  border-radius: 0.25rem;
}
.card-grid, .gallery-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}
.card h3 { margin: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.25rem; max-width: 32rem; }
.field input, .field textarea, .field select {
  padding: 0.5rem;
  border: 1px solid var(--muted);
  border-radius: 0.25rem;
  font: inherit;
}
button {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border: 0;
  border-radius: 0.25rem;
  font: inherit;
  cursor: pointer;
}
nav.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  max-width: 68rem;
  margin: 0 auto;
  padding: 1rem 1.25rem;
}
nav.site-nav .site-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.25rem; margin-right: auto; }
nav.site-nav a { color: inherit; text-decoration: none; }
nav.site-nav a.active { font-weight: 600; text-decoration: underline; }
footer.site-footer { padding: 2.5rem 1.25rem; text-align: center; font-size: 0.875rem; color: var(--muted); }
footer.site-footer a { color: inherit; }
.placeholder { color: var(--muted); font-style: italic; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`;
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
  <header>
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

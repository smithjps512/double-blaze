import type { ContentDraft } from "./spark-trailhead";

/**
 * Draft renderer. Turns the Spark ContentDraft (title, palette, per-section
 * copy) into a clickable, standalone HTML page the customer reviews BEFORE the
 * real site is built. It is deliberately deterministic (no AI call): it is a
 * visual mockup of flow and look, not a wired site. Images and forms render as
 * labelled placeholders so the customer focuses on layout and messaging rather
 * than functionality.
 *
 * Mirrors the "preview" link style in trailhead-render: pages link to each other
 * through the token-scoped draft route, so the draft is clickable before any
 * public DNS exists. The route serves this only while the site is pre-publish,
 * so the link naturally expires once the customer publishes.
 */

/** A short slug list for the top navigation. */
function draftNavHref(token: string, slug: string): string {
  return slug === "home"
    ? `/api/trailhead/draft-preview/${token}`
    : `/api/trailhead/draft-preview/${token}?page=${encodeURIComponent(slug)}`;
}

/**
 * Render one page of the draft as a complete HTML document. `pageIndex` selects
 * the page; the customer navigates between pages via the returned nav.
 */
export function renderDraftPage(
  draft: ContentDraft,
  pageIndex: number,
  siteName: string,
  token: string,
): string | null {
  const pages = Array.isArray(draft.pages) ? draft.pages : [];
  const page = pages[pageIndex];
  if (!page) return null;

  const palette = draft.color_palette ?? {
    primary: "#1f2937",
    secondary: "#374151",
    accent: "#f97316",
    background: "#ffffff",
    text: "#111827",
  };

  const navHtml = pages
    .map((p) => {
      const active = p.slug === page.slug ? ' aria-current="page" class="active"' : "";
      return `<a href="${escapeAttr(draftNavHref(token, p.slug))}"${active}>${escapeHtml(p.title)}</a>`;
    })
    .join("\n        ");

  const sectionsHtml = (page.sections ?? [])
    .map((s) => renderSection(s.type, s.heading, s.body))
    .join("\n");

  const title = draft.site_title || siteName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(page.title)} | ${escapeHtml(title)} (draft)</title>
  <style>
    :root {
      --primary: ${escapeCss(palette.primary)};
      --secondary: ${escapeCss(palette.secondary)};
      --accent: ${escapeCss(palette.accent)};
      --bg: ${escapeCss(palette.background)};
      --text: ${escapeCss(palette.text)};
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }

    /* Draft banner: always visible, sets expectations. */
    .draft-banner {
      position: sticky; top: 0; z-index: 50;
      background: #111827; color: #f9fafb;
      padding: 0.6rem 1rem; text-align: center;
      font-size: 0.85rem; line-height: 1.4;
    }
    .draft-banner strong { color: #fdba74; }

    nav.site-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 1rem 2rem; background: var(--bg); border-bottom: 1px solid rgba(0,0,0,0.08); }
    nav.site-nav .site-name { font-weight: 700; font-size: 1.25rem; margin-right: auto; color: var(--primary); }
    nav.site-nav a { text-decoration: none; }
    nav.site-nav a.active { font-weight: 700; color: var(--accent); }
    nav.site-nav a:hover { opacity: 0.75; }

    section.blk { padding: 3rem 2rem; }
    section.blk .inner { max-width: 900px; margin: 0 auto; }
    section.hero { background: var(--primary); color: #fff; padding: 5rem 2rem; text-align: center; }
    section.hero h1 { font-size: 2.5rem; margin: 0 0 1rem; }
    section.hero p { font-size: 1.2rem; opacity: 0.92; margin: 0 auto; max-width: 640px; }
    section.blk h2 { font-size: 1.75rem; margin: 0 0 0.75rem; color: var(--primary); }
    section.alt { background: rgba(0,0,0,0.03); }

    .btn { display: inline-block; margin-top: 1.25rem; padding: 0.75rem 1.5rem; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 600; text-decoration: none; }
    .btn[disabled], .btn.mock { opacity: 0.9; cursor: default; }

    .ph-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .ph-tile { aspect-ratio: 4 / 3; border: 2px dashed rgba(0,0,0,0.18); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.45); font-size: 0.85rem; text-align: center; padding: 0.5rem; }

    .mock-form { margin-top: 1.5rem; max-width: 460px; }
    .mock-form .field { height: 2.75rem; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 0.75rem; background: #fff; }
    .mock-form .field.area { height: 6rem; }

    footer.site-footer { padding: 2.5rem 2rem; text-align: center; font-size: 0.875rem; opacity: 0.7; border-top: 1px solid rgba(0,0,0,0.08); }
    footer.site-footer a { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="draft-banner">
    This is a <strong>clickable draft</strong>, not the finished site. Focus on the flow, wording, and look. Buttons, forms, and photos are placeholders, everything will be fully wired and functional once we build it.
  </div>

  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <span class="site-name">${escapeHtml(title)}</span>
    ${navHtml}
  </nav>

  <main>
${sectionsHtml}
  </main>

  <footer class="site-footer">
    <p>${escapeHtml(draft.footer?.text || title)}</p>
    <p><a href="https://doubleblaze.solutions">Built by Double Blaze</a></p>
  </footer>
</body>
</html>`;
}

/** Render a single content section by its type, with placeholders for media. */
function renderSection(type: string, heading: string, body: string): string {
  const h = heading ? `<h2>${escapeHtml(heading)}</h2>` : "";
  const p = body ? `<p>${escapeHtml(body)}</p>` : "";

  switch (type) {
    case "hero":
      return `    <section class="hero">
      <h1>${escapeHtml(heading || "")}</h1>
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    </section>`;
    case "gallery":
      return `    <section class="blk alt"><div class="inner">
      ${h}${p}
      <div class="ph-grid">
        ${Array.from({ length: 6 }, () => `<div class="ph-tile">Your photo here</div>`).join("\n        ")}
      </div>
    </div></section>`;
    case "cta":
      return `    <section class="blk"><div class="inner" style="text-align:center">
      ${h}${p}
      <span class="btn mock">${escapeHtml(heading ? "Get started" : "Learn more")}</span>
    </div></section>`;
    case "contact":
      return `    <section class="blk alt"><div class="inner">
      ${h}${p}
      <div class="mock-form" aria-hidden="true">
        <div class="field"></div>
        <div class="field"></div>
        <div class="field area"></div>
        <span class="btn mock">Send message</span>
      </div>
    </div></section>`;
    case "features":
      return `    <section class="blk"><div class="inner">
      ${h}${p}
    </div></section>`;
    case "text":
    default:
      return `    <section class="blk"><div class="inner">
      ${h}${p}
    </div></section>`;
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Only allow simple color tokens into the CSS var, so a bad palette can't inject CSS. */
function escapeCss(s: string): string {
  return String(s).replace(/[^#a-zA-Z0-9(),.%\s-]/g, "").slice(0, 40) || "inherit";
}

/** Index of the page matching `slug`, or 0 (home) when not found. */
export function draftPageIndex(draft: ContentDraft, slug: string | null): number {
  if (!slug) return 0;
  const pages = Array.isArray(draft.pages) ? draft.pages : [];
  const i = pages.findIndex((p) => p.slug === slug);
  return i < 0 ? 0 : i;
}

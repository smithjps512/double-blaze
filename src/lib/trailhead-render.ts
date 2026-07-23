/**
 * Trailhead template renderer. Produces static HTML files from built site
 * content. Designed for both live serving (via the trailhead-site route) and
 * static export (zip bundle in stage 6).
 *
 * Every page is a self-contained HTML document with inlined CSS: no external
 * dependencies, no JavaScript framework, no build step. This is what makes
 * the export promise real from day one.
 */

import type { BuiltSite } from "./spark-trailhead";

export interface RenderedPage {
  slug: string;
  filename: string;
  title: string;
  html: string;
}

/**
 * How internal navigation links are written:
 * - "export": static files on disk (`/index.html`, `/about.html`). This is the
 *   self-contained bundle that backs the export zip and works without the app.
 * - "live": app-routable paths (`/`, `/about`) served at the public subdomain.
 * - "preview": token-scoped links through the app, so the customer can view the
 *   preview before public DNS exists.
 */
export type LinkStyle = "export" | "live" | "preview";

function navHref(
  slug: string,
  linkStyle: LinkStyle,
  token?: string,
): string {
  const isHome = slug === "home";
  switch (linkStyle) {
    case "live":
      return isHome ? "/" : `/${slug}`;
    case "preview":
      return isHome
        ? `/api/trailhead/preview/${token}`
        : `/api/trailhead/preview/${token}?page=${encodeURIComponent(slug)}`;
    case "export":
    default:
      return isHome ? "/index.html" : `/${slug}.html`;
  }
}

/**
 * Render a full static HTML page from a built page and the site config.
 * The output is a complete, standalone HTML document.
 */
export function renderPage(
  site: BuiltSite,
  pageIndex: number,
  subdomain: string,
  linkStyle: LinkStyle = "export",
  token?: string,
): RenderedPage | null {
  const page = site.pages[pageIndex];
  if (!page) return null;

  const nav = site.config.navigation ?? [];
  const siteName = site.config.siteName ?? subdomain;
  const footerCredit = site.config.footerCredit !== false;

  const navHtml = nav
    .map((item) => {
      const href = navHref(item.slug, linkStyle, token);
      const active = item.slug === page.slug ? ' class="active"' : "";
      return `<a href="${escapeAttr(href)}"${active}>${escapeHtml(item.label)}</a>`;
    })
    .join("\n        ");

  const footerHtml = footerCredit
    ? `\n      <p class="db-credit"><a href="https://doubleblaze.solutions">Built by Double Blaze</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} | ${escapeHtml(siteName)}</title>
  <style>
${site.global_css ?? ""}
${page.css ?? ""}

/* Navigation */
nav.site-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: inherit;
}
nav.site-nav .site-name {
  font-weight: 700;
  font-size: 1.25rem;
  margin-right: auto;
}
nav.site-nav a {
  text-decoration: none;
  color: inherit;
}
nav.site-nav a.active {
  font-weight: 600;
}
nav.site-nav a:hover {
  opacity: 0.8;
}

/* Footer */
footer.site-footer {
  padding: 2rem;
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.7;
}
footer.site-footer .db-credit a {
  color: inherit;
  text-decoration: underline;
}

/* Base reset */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <span class="site-name">${escapeHtml(siteName)}</span>
    ${navHtml}
  </nav>

  <main>
    ${page.html}
  </main>

  <footer class="site-footer">
    <p>${escapeHtml(siteName)}</p>${footerHtml}
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

/**
 * Render all pages of a site. Returns an array of rendered pages suitable
 * for both live serving and zip export.
 */
export function renderAllPages(site: BuiltSite, subdomain: string): RenderedPage[] {
  const pages: RenderedPage[] = [];
  for (let i = 0; i < site.pages.length; i++) {
    const rendered = renderPage(site, i, subdomain, "export");
    if (rendered) pages.push(rendered);
  }
  return pages;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

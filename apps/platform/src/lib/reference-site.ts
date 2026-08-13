/**
 * Reference site profiling for Trailhead. Server-side only in practice (it makes
 * outbound fetches and is called from the draft pipeline); the `server-only`
 * guard is omitted so the pure extraction can be unit-tested, matching the other
 * tested lib modules here.
 *
 * Customers give us a site they like the feel of (intake.inspiration_url). That
 * link is the single strongest signal for how their site should look, because
 * they will judge our draft against it. Spark cannot browse, so a bare URL only
 * helps when Spark already recognizes the site. To make ANY reference count, we
 * fetch the page once at draft time and extract a compact design profile
 * (colors, fonts, title, description) that we feed into the draft prompt.
 *
 * The network layer is deliberately thin and bounded (one page plus at most two
 * stylesheets, size and time capped, with SSRF guards). The extraction is pure
 * and dependency-free so it is unit-testable without a live fetch.
 */

export interface ReferenceProfile {
  url: string;
  title?: string;
  description?: string;
  themeColor?: string;
  /** Prominent colors, most frequent first, normalized to lowercase hex/rgb. */
  colors: string[];
  /** Named font families, generic keywords dropped. */
  fonts: string[];
}

// Fetch bounds. This runs once per site at draft time, so a few small fetches
// are fine, but they must never stall the draft or pull down a huge asset.
const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 512 * 1024; // 512KB is plenty of markup/CSS to profile.
const MAX_STYLESHEETS = 2;
const MAX_COLORS = 6;
const MAX_FONTS = 4;

const GENERIC_FONTS = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "-apple-system",
  "blinkmacsystemfont",
  "inherit",
  "initial",
  "unset",
  "revert",
]);

/**
 * SSRF guard. Only http(s), and never a host that is loopback, link-local, or a
 * private-range IP literal. This does not resolve DNS, so it is a baseline, not
 * a complete defense against DNS-rebinding; the final response host is
 * re-checked after any redirects.
 */
export function isSafeReferenceUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  return !isPrivateHost(u.hostname);
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  // IPv6 loopback / unique-local / link-local.
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }
  // IPv4 literal in a private / loopback / link-local range.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

/** Read a bounded amount of text from a response, aborting if it runs long. */
async function readCapped(res: Response): Promise<string> {
  const body = res.body;
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (total >= MAX_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
  }
  return out;
}

async function fetchText(url: string, signal: AbortSignal): Promise<string | null> {
  if (!isSafeReferenceUrl(url)) return null;
  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        // A normal desktop UA; some sites 403 an empty agent.
        "user-agent":
          "Mozilla/5.0 (compatible; DoubleBlazeTrailhead/1.0; +https://doubleblaze.solutions)",
        accept: "text/html,text/css,*/*",
      },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  // Re-validate the host after any redirects.
  if (res.url && !isSafeReferenceUrl(res.url)) return null;
  return readCapped(res);
}

/**
 * Fetch the reference page (and up to two of its stylesheets) and build a design
 * profile. Returns null on any failure, so a bad or slow reference never blocks
 * the draft.
 */
export async function fetchReferenceProfile(rawUrl: string): Promise<ReferenceProfile | null> {
  const url = rawUrl.trim();
  if (!url || !isSafeReferenceUrl(url)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const html = await fetchText(url, controller.signal);
    if (!html) return null;

    // Pull in a couple of linked stylesheets so external CSS still contributes
    // colors and fonts (modern sites keep almost nothing inline).
    const sheetUrls = stylesheetHrefs(html, url).slice(0, MAX_STYLESHEETS);
    const sheets = await Promise.all(sheetUrls.map((s) => fetchText(s, controller.signal)));
    const css = sheets.filter((s): s is string => Boolean(s)).join("\n");

    return extractProfileFromHtml(html, { url, css });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Absolute-resolved hrefs of <link rel="stylesheet"> tags. */
function stylesheetHrefs(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const linkRe = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      out.push(new URL(href, baseUrl).href);
    } catch {
      // skip unresolvable href
    }
  }
  return out;
}

/**
 * Pure extraction from markup (plus optional external CSS text). No network, no
 * DOM: regex over the raw source, which is enough for the coarse signals a
 * design profile needs.
 */
export function extractProfileFromHtml(
  html: string,
  opts: { url: string; css?: string },
): ReferenceProfile {
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const inlineStyles = [...html.matchAll(/style\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const cssText = [opts.css ?? "", ...styleBlocks, ...inlineStyles].join("\n");

  return {
    url: opts.url,
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: metaContent(html, "description"),
    themeColor: metaContent(html, "theme-color"),
    colors: topColors(cssText, MAX_COLORS),
    fonts: namedFonts(html, cssText, MAX_FONTS),
  };
}

function firstMatch(text: string, re: RegExp): string | undefined {
  const v = text.match(re)?.[1]?.replace(/\s+/g, " ").trim();
  return v || undefined;
}

function metaContent(html: string, name: string): string | undefined {
  // Match name/property before or after content, in either attribute order.
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const nm = tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (nm?.toLowerCase() === name.toLowerCase()) {
      const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
      if (content) return content.replace(/\s+/g, " ").trim();
    }
  }
  return undefined;
}

/** Frequency-ranked colors, normalized so #FFF and #ffffff count together. */
function topColors(css: string, limit: number): string[] {
  const counts = new Map<string, number>();
  const add = (raw: string) => {
    const key = normalizeColor(raw);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) add(m[0]);
  for (const m of css.matchAll(/rgba?\([^)]*\)/gi)) add(m[0]);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c);
}

function normalizeColor(raw: string): string | null {
  const c = raw.trim().toLowerCase();
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) hex = hex.split("").map((ch) => ch + ch).join("");
    if (hex.length === 8) hex = hex.slice(0, 6); // drop alpha
    if (hex.length !== 6 || /[^0-9a-f]/.test(hex)) return null;
    return `#${hex}`;
  }
  // Collapse rgb/rgba whitespace so equal colors dedupe.
  if (c.startsWith("rgb")) return c.replace(/\s+/g, "");
  return null;
}

/** Named font families from Google Fonts links and font-family declarations. */
function namedFonts(html: string, css: string, limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (nameRaw: string) => {
    const name = nameRaw.replace(/["']/g, "").replace(/\+/g, " ").trim();
    const key = name.toLowerCase();
    if (!name || GENERIC_FONTS.has(key) || seen.has(key)) return;
    seen.add(key);
    out.push(name);
  };

  // Google Fonts: ...css2?family=Roboto:wght@400&family=Open+Sans
  for (const link of html.match(/<link\b[^>]*fonts\.googleapis\.com[^>]*>/gi) ?? []) {
    const href = link.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    for (const fam of href.matchAll(/family=([^:&"']+)/gi)) push(decodeURIComponent(fam[1]));
  }
  // font-family declarations: take the first (preferred) family in the stack.
  for (const decl of css.matchAll(/font-family\s*:\s*([^;{}"]+)/gi)) {
    const first = decl[1].split(",")[0];
    if (first) push(first);
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

/**
 * Render a profile as a compact block for the draft prompt. Returns null when
 * there is no useful signal, so we never inject an empty section.
 */
export function formatReferenceProfile(profile: ReferenceProfile | null): string | null {
  if (!profile) return null;
  const lines: string[] = [];
  if (profile.title) lines.push(`Title: ${profile.title}`);
  if (profile.description) lines.push(`Description: ${profile.description}`);
  if (profile.themeColor) lines.push(`Declared theme color: ${profile.themeColor}`);
  if (profile.colors.length) lines.push(`Prominent colors (most used first): ${profile.colors.join(", ")}`);
  if (profile.fonts.length) lines.push(`Fonts: ${profile.fonts.join(", ")}`);
  if (lines.length === 0) return null;
  return `Reference site the customer chose (${profile.url}):\n${lines.join("\n")}`;
}

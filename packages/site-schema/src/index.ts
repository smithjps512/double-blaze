/**
 * Content types for customer sites, shared by the platform (which authors and
 * builds) and the site runtime (which serves).
 *
 * Two content models live here on purpose, and they are not the same thing.
 *
 * `BuiltSite` is the legacy Trailhead shape: pages carrying model-authored HTML
 * fragments. It is what every existing Trailhead site is stored as, so it stays
 * supported and unchanged. It is not the target for paid sites: raw HTML cannot
 * be safely edited, restyled, or validated, which is fine for a free five page
 * brochure that gets rebuilt when it is wrong and not fine for a site someone
 * pays for.
 *
 * `Block` is where paid sites are going. The renderer owns all markup, so
 * output stays consistent, accessible, and safe, and a block list can be
 * edited, themed, and validated. Rendering still emits plain static HTML, so
 * the export promise survives.
 *
 * Pure types and pure functions only. No server imports, no framework, no
 * database. Both apps import this, including client bundles.
 */

// ---------------------------------------------------------------------------
// Legacy Trailhead content (migration 0008: trailhead_sites.built_content)
// ---------------------------------------------------------------------------

export interface BuiltPage {
  slug: string;
  title: string;
  html: string;
}

export interface BuiltSiteConfig {
  footerCredit: boolean;
  siteName: string;
  navigation: Array<{ label: string; slug: string }>;
}

export interface BuiltSite {
  pages: BuiltPage[];
  config: BuiltSiteConfig;
}

// ---------------------------------------------------------------------------
// Block content (the model for paid sites)
// ---------------------------------------------------------------------------

/** A reference to a stored asset, resolved to a URL at render time. */
export interface AssetRef {
  assetId: string;
  alt?: string;
}

export interface Cta {
  label: string;
  href: string;
}

export interface Card {
  title: string;
  body?: string;
  media?: AssetRef;
  cta?: Cta;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
  required?: boolean;
  options?: string[];
}

/**
 * The block set.
 *
 * `html` is the escape hatch for the one thing a client needs that the block
 * set does not cover. Staff authored only: never model authored, never client
 * authored. Everything else in this union is structured precisely so the
 * renderer, not the author, decides what markup gets emitted.
 */
export type Block =
  | { type: "hero"; heading: string; sub?: string; media?: AssetRef; cta?: Cta }
  | { type: "prose"; markdown: string }
  | { type: "cards"; heading?: string; items: Card[] }
  | { type: "gallery"; heading?: string; assets: AssetRef[] }
  | { type: "roster"; heading?: string; source: "manual" | "members"; fields: string[] }
  | { type: "events"; heading?: string; source: "manual" | "calendar"; limit: number }
  | { type: "form"; heading?: string; formKey: string; fields: FormField[]; deliverTo: string }
  | { type: "members_only"; blocks: Block[] }
  | { type: "html"; html: string };

export type BlockType = Block["type"];

export interface SitePage {
  slug: string;
  title: string;
  /** Omitted from navigation when false. Defaults to true. */
  inNav?: boolean;
  blocks: Block[];
}

/** Design tokens. One place to change so every page restyles together. */
export interface SiteTheme {
  colors: {
    background: string;
    text: string;
    primary: string;
    accent: string;
    muted: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}

export interface SiteContent {
  siteName: string;
  tagline?: string;
  pages: SitePage[];
  theme: SiteTheme;
  /** The "Built by Double Blaze" credit. Removed on any paid tier. */
  footerCredit: boolean;
}

// ---------------------------------------------------------------------------
// Link styles
// ---------------------------------------------------------------------------

/**
 * How internal navigation links are written:
 * - "export": static files on disk (`/index.html`, `/about.html`). The
 *   self-contained bundle behind the export zip, which works without the app.
 * - "live": app-routable paths (`/`, `/about`) served at the public hostname.
 * - "preview": token-scoped links through the platform, so a customer can view
 *   a site before any public DNS exists.
 */
export type LinkStyle = "export" | "live" | "preview";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const BLOCK_TYPES: ReadonlySet<string> = new Set([
  "hero",
  "prose",
  "cards",
  "gallery",
  "roster",
  "events",
  "form",
  "members_only",
  "html",
]);

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && BLOCK_TYPES.has(value);
}

/**
 * Narrow unknown JSON to SiteContent.
 *
 * Deliberately shallow: it confirms the shape the renderer depends on rather
 * than every leaf, because content comes from our own database rather than from
 * a request body. The job is catching a malformed or half-migrated row before
 * it reaches the renderer, not defending a trust boundary.
 */
export function isSiteContent(value: unknown): value is SiteContent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.siteName !== "string") return false;
  if (!Array.isArray(v.pages)) return false;
  return v.pages.every((p) => {
    if (typeof p !== "object" || p === null) return false;
    const page = p as Record<string, unknown>;
    return (
      typeof page.slug === "string" &&
      typeof page.title === "string" &&
      Array.isArray(page.blocks) &&
      page.blocks.every(
        (b) =>
          typeof b === "object" &&
          b !== null &&
          isBlockType((b as Record<string, unknown>).type),
      )
    );
  });
}

/** Narrow unknown JSON to the legacy Trailhead shape. */
export function isBuiltSite(value: unknown): value is BuiltSite {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.pages) || v.pages.length === 0) return false;
  return v.pages.every(
    (p) =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as Record<string, unknown>).slug === "string",
  );
}
export * from "./addressing";

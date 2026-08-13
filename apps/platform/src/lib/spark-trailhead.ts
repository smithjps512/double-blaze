import "server-only";
import {
  callSpark,
  callSparkDetailed,
  callSparkStructured,
  extractJson,
  isAnthropicConfigured,
  type AnthropicMessage,
} from "./anthropic";
import { validateTrailheadBuild, type BoundaryViolation } from "./trailhead-boundary";

/**
 * Spark for Trailhead. Separate from the Trail Run spark (spark.ts).
 *
 * Two Spark roles:
 * 1. Content drafting: takes the intake and drafts site messaging, page copy,
 *    and brand choices for customer approval (stage 4).
 * 2. Site building: takes approved content and a template, produces the built
 *    site as structured HTML/CSS per page (stage 4, after approval).
 *
 * Plus a non-blocking intake flag scan for out-of-scope intent.
 *
 * House style: warm, plainspoken, calm, no em dashes.
 */

export { isAnthropicConfigured };

// ---------------------------------------------------------------------------
// Hard boundary block (embedded in every Trailhead system prompt)
// ---------------------------------------------------------------------------
const BOUNDARY_BLOCK = `HARD BOUNDARIES. You must NEVER build, promise, or imply any of these:
- Ecommerce, shopping carts, checkout, or any payment collection
- A custom domain (the site lives at a doubleblaze.solutions subdomain, full stop)
- Booking, scheduling, or appointment setting functionality
- Member dues, paid memberships, or gated paid content
- Third-party integrations
- More than 5 pages
- Removal of the "Built by Double Blaze" footer credit

When a customer asks for something out of scope, do not refuse coldly. An out-of-scope
request is a buying signal. Name what Trailhead does not include, explain which package
does include it (Green Trail $199/mo for ecommerce, custom domains, and scheduling; Blue
Trail $499/mo for automation and inventory; Black Trail $999/mo for content and marketing;
Double Black $1,499/mo for integrations and scale), and offer the upgrade, which is one
click. If the request is genuinely custom and beyond the packages, say we would be glad
to price it and that someone will contact them directly, then flag it internally. Stay
warm and helpful. You are pointing up the trail, not saying no.`;

// ---------------------------------------------------------------------------
// Content drafting (stage 4, before build)
// ---------------------------------------------------------------------------
function contentDraftSystemPrompt(): string {
  return `You are Spark, the site builder for Double Blaze Trailhead. You are drafting site
messaging, page copy, and brand choices from a customer's intake form. The customer will
review, edit, and approve this draft before anything is built.

${BOUNDARY_BLOCK}

Write in the customer's voice, not ours. Match their tone choice. Keep copy concise and
genuine. Never use em dashes. Use commas, colons, and periods.

DESIGN REFERENCE. When the intake includes a reference site (the site the customer said
they like the feel of), treat it as the single strongest signal for the look and feel of
this site, because the customer will judge our draft against it. If a "Reference site the
customer chose" block is provided, use it to guide two things: (1) the color_palette,
anchored on the reference's prominent colors and declared theme color, adjusted only for
contrast and accessibility, and (2) the tone_summary, which must describe the visual feel
to emulate: the color mood, the typography feel (name the reference's fonts when given),
the density and structure, and whether the look reads modern, classic, minimal, or bold.
Write tone_summary so a builder who never saw the reference could reproduce its feel. If a
reference site's colors clash with an explicit "must use" color the customer gave, honor
the customer's required color and let the reference guide the rest. If no reference block
is provided, choose a palette and feel that fit the business and tone.

Return a JSON object with this structure:
{
  "site_title": "string",
  "tagline": "string",
  "color_palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "tone_summary": "string describing the chosen tone and how it applies",
  "pages": [
    {
      "slug": "home",
      "title": "Page Title",
      "sections": [
        { "type": "hero|text|features|gallery|contact|cta", "heading": "string", "body": "string" }
      ]
    }
  ],
  "footer": { "text": "string", "show_phone": boolean, "show_address": boolean },
  "notes_for_customer": "string, anything the customer should know about the choices made"
}

Only include pages the customer selected. Do not exceed 5 pages.`;
}

export interface ContentDraft {
  site_title: string;
  tagline: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  tone_summary: string;
  pages: Array<{
    slug: string;
    title: string;
    sections: Array<{
      type: string;
      heading: string;
      body: string;
    }>;
  }>;
  footer: {
    text: string;
    show_phone: boolean;
    show_address: boolean;
  };
  notes_for_customer: string;
}

/**
 * Draft site content from the intake for customer review and approval.
 */
export async function draftContent(
  intake: Record<string, unknown>,
  referenceBlock?: string | null,
): Promise<ContentDraft | null> {
  const system = contentDraftSystemPrompt();
  const reference = referenceBlock ? `\n\n${referenceBlock}` : "";
  const userMessage: AnthropicMessage = {
    role: "user",
    content: `Here is the completed Trailhead intake form:\n${JSON.stringify(intake, null, 2)}${reference}\n\nDraft the site content for customer approval. Return JSON only, no prose.`,
  };

  const structured = await callSparkStructured<ContentDraft>({
    system,
    messages: [userMessage],
    schema: CONTENT_DRAFT_SCHEMA,
    maxTokens: 3000,
  });
  if (structured) return structured;

  // Fallback: prompt-and-parse
  const raw = await callSpark({
    system: `${system}\n\nRespond with STRICT JSON only, no prose and no code fences.`,
    messages: [userMessage],
    maxTokens: 3000,
  });
  return extractJson<ContentDraft>(raw);
}

const CONTENT_DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    site_title: { type: "string" },
    tagline: { type: "string" },
    color_palette: {
      type: "object",
      additionalProperties: false,
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
        background: { type: "string" },
        text: { type: "string" },
      },
      required: ["primary", "secondary", "accent", "background", "text"],
    },
    tone_summary: { type: "string" },
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { type: "string" },
                heading: { type: "string" },
                body: { type: "string" },
              },
              required: ["type", "heading", "body"],
            },
          },
        },
        required: ["slug", "title", "sections"],
      },
    },
    footer: {
      type: "object",
      additionalProperties: false,
      properties: {
        text: { type: "string" },
        show_phone: { type: "boolean" },
        show_address: { type: "boolean" },
      },
      required: ["text", "show_phone", "show_address"],
    },
    notes_for_customer: { type: "string" },
  },
  required: [
    "site_title",
    "tagline",
    "color_palette",
    "tone_summary",
    "pages",
    "footer",
    "notes_for_customer",
  ],
};

// ---------------------------------------------------------------------------
// Site building (stage 4, after approval): produces one static HTML page per
// call, each fully self-contained with inline styles.
//
// The site is built one page at a time, not in a single call. A whole 5-page
// site does not fit in one model response at any token cap that also fits
// inside the function's time limit: the output truncates mid-JSON, fails to
// parse, and the build silently gives up. Building each page in its own bounded
// call keeps every response small enough to complete, and the calls run
// concurrently so the wall-clock is the slowest single page, not the sum.
// Styling is inline per page, so there is no separate stylesheet call. Config is
// derived deterministically rather than asked for, so it is always valid.
// ---------------------------------------------------------------------------

// The stored shape is defined once, in the shared schema, so the platform and
// the site runtime cannot drift on what a built site is. Re-exported here
// because Trailhead code has always imported it from this module.
export type { BuiltSite, BuiltPage } from "@double-blaze/site-schema";
import type { BuiltSite, BuiltPage, BuiltSiteConfig } from "@double-blaze/site-schema";

type SiteConfig = BuiltSiteConfig;

function pageBuildSystemPrompt(): string {
  return `You are Spark, building ONE page of a Trailhead site for Double Blaze from the
customer's approved content. Build only the single page described.

${BOUNDARY_BLOCK}

Output the page as an HTML fragment: body content only. Start your response with the first HTML
tag and end with the last one. Do NOT wrap it in <html>, <head>, or <body>. Do NOT use markdown
code fences. Do NOT add any explanation before or after the HTML.

Rules:
- Build ONLY the one page in the user message. Do not build other pages.
- Do NOT emit a site header, the site title/logo, a top navigation bar, or a
  footer. The site chrome (navigation and footer, including the Double Blaze
  credit) is added automatically around your HTML, so emitting your own would
  duplicate it. Start your output with the page's own first content section.
- You MAY use relative links to other pages inside page content (for example a
  call-to-action button), matching the provided navigation list, but do not
  build a navigation menu.
- Use the approved color palette. Put styles in inline style attributes so the
  fragment is fully self-contained and works as a standalone static file for
  export. Do not reference an external stylesheet or class names.
- Clean, semantic, accessible markup.
- No payment forms, cart components, checkout elements, or external payment scripts. No custom domain references. Relative links only.
- Never use em dashes. Use commas, colons, and periods.

LAYOUT AND SYMMETRY. The page must look balanced and intentional, never like a
cheap template. Follow these rules exactly:
- Center every section's inner content container horizontally with margin: 0 auto,
  and use ONE consistent max content width for the ordinary text sections down the
  whole page: pick a single value around 760px and reuse it, so stacked sections
  share the same left and right edges. Do not let the max-width drift from section
  to section.
- Hold one text alignment within a section. A hero or call-to-action band may be
  centered; ordinary content sections pick left or center and keep it. Never center
  one paragraph and left-align the next inside the same visual band.
- Lay out any row of repeating cards, tiles, stats, or feature blocks with
  display: flex; flex-wrap: wrap; justify-content: center; and give each item a
  flex-basis (for example flex: 1 1 260px) with a max-width. This wraps responsively
  AND keeps any incomplete final row centered instead of stranding a lone card off to
  one side. Do NOT use grid auto-fit or auto-fill for a fixed set of cards: it drops a
  single orphaned card onto its own left-aligned row at common widths.
- Give every repeating group a balanced count that fills its rows. Three across is
  the safe default. If the content leaves an awkward count like four or five, either
  trim to the three strongest items or round up to a full row of six, whichever serves
  the content best. Prefer three balanced blocks over four unbalanced ones.`;
}

/** Success carries the value; failure carries a short, diagnosable reason. */
type Built<T> = { ok: true; value: T } | { ok: false; reason: string };

/**
 * Strip a markdown code fence if the model wrapped its output in one despite
 * being told not to. Returns the fenced content, or the trimmed text if there
 * is no fence.
 */
function stripCodeFences(text: string): string {
  const fence = text.trim().match(/```[a-z]*\s*\n?([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}

/** Body content HTML from a raw response: strip any fence, drop leading prose. */
function extractHtmlFragment(text: string): string | null {
  let html = stripCodeFences(text);
  const first = html.indexOf("<");
  if (first === -1) return null;
  if (first > 0) html = html.slice(first);
  html = html.trim();
  return html.startsWith("<") ? html : null;
}

/**
 * One page, in its own call, as raw HTML text (not JSON): models escape large
 * code blocks into JSON strings unreliably, and raw text sidesteps that. All
 * styling is inline in the fragment, so a page returns only HTML. `violations`
 * re-prompts a fix.
 */
async function buildPage(
  page: ContentDraft["pages"][number],
  approved: ContentDraft,
  config: SiteConfig,
  violations?: BoundaryViolation[],
): Promise<Built<BuiltPage>> {
  const fixNote =
    violations && violations.length > 0
      ? `\n\nThe previous build of this page had boundary violations that must be fixed:\n${violations
          .map((v) => `- ${v.type}: ${v.detail}`)
          .join("\n")}\nRemove the violating elements.`
      : "";
  const { text, truncated, stopReason } = await callSparkDetailed({
    system: pageBuildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: `Site: ${approved.site_title}\nColor palette:\n${JSON.stringify(approved.color_palette, null, 2)}\nNavigation (relative links to these pages):\n${JSON.stringify(config.navigation, null, 2)}\n\nBuild this page now:\n${JSON.stringify(page, null, 2)}${fixNote}\n\nOutput only the HTML.`,
      },
    ],
    // Same truncation failure mode as the stylesheet: a content-rich page can
    // exceed 8000 tokens and hard-fail. Give it the same headroom; unused
    // ceiling is free.
    maxTokens: 16000,
  });
  if (truncated) return { ok: false, reason: "truncated at max_tokens" };
  if (text == null) return { ok: false, reason: `call returned nothing (${stopReason ?? "unknown"})` };
  const html = extractHtmlFragment(text);
  if (html == null) return { ok: false, reason: "no HTML content in response" };
  return { ok: true, value: { slug: page.slug, title: page.title, html } };
}

/** Pull the page slug a per-page boundary violation names, if any. */
function slugFromViolation(v: BoundaryViolation): string | null {
  const m = v.detail.match(/Page "([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * Build the site from approved content, one page per call plus a shared
 * stylesheet, all concurrently. Config is derived deterministically. Runs the
 * structural boundary validator on the assembled site; if a page violates a
 * boundary, that page (and only that page) is rebuilt once with the violation
 * noted. Returns the assembled site, any remaining violations, and a reason
 * string when the site could not be built (so the failure is diagnosable).
 */
export async function buildSite(
  approvedContent: ContentDraft,
  _intake: Record<string, unknown>,
): Promise<{ site: BuiltSite | null; violations: BoundaryViolation[]; reason?: string }> {
  const pagesIn = approvedContent.pages ?? [];
  if (pagesIn.length === 0) {
    return { site: null, violations: [], reason: "approved content has no pages" };
  }

  // Deterministic config: never asked for, so it is always valid.
  const config: SiteConfig = {
    footerCredit: true,
    siteName: approvedContent.site_title ?? "",
    navigation: pagesIn.map((p) => ({ label: p.title, slug: p.slug })),
  };

  // Every page at once; wall-clock is the slowest single call. Styling is inline
  // per page, so there is no separate stylesheet step.
  const pageResults = await Promise.all(pagesIn.map((p) => buildPage(p, approvedContent, config)));

  const failedIdx = pageResults.findIndex((r) => !r.ok);
  if (failedIdx !== -1) {
    const failed = pageResults[failedIdx] as { ok: false; reason: string };
    return {
      site: null,
      violations: [],
      reason: `page "${pagesIn[failedIdx].slug}": ${failed.reason}`,
    };
  }
  const pages = pageResults.map((r) => (r as { ok: true; value: BuiltPage }).value);

  let site: BuiltSite = { pages, config };
  let violations = validateTrailheadBuild(site);
  if (violations.length === 0) return { site, violations: [] };

  // Rebuild only the pages a violation names, once, with the violation noted.
  const badSlugs = new Set(
    violations.map(slugFromViolation).filter((s): s is string => s != null),
  );
  if (badSlugs.size > 0) {
    const rebuilt = await Promise.all(
      site.pages.map(async (built) => {
        if (!badSlugs.has(built.slug)) return built;
        const src = pagesIn.find((p) => p.slug === built.slug);
        if (!src) return built;
        const fixed = await buildPage(
          src,
          approvedContent,
          config,
          violations.filter((v) => slugFromViolation(v) === built.slug),
        );
        return fixed.ok ? fixed.value : built;
      }),
    );
    site = { pages: rebuilt, config };
  }

  violations = validateTrailheadBuild(site);
  return { site, violations };
}

// ---------------------------------------------------------------------------
// Intake flag scan (non-blocking, keywords allowed here per corrections)
// ---------------------------------------------------------------------------

/**
 * Scan intake free-text fields for out-of-scope intent. Returns an array of
 * flag strings for internal use. Non-blocking: these are upgrade conversation
 * signals, not rejections.
 */
export async function scanIntakeForFlags(
  intake: Record<string, unknown>,
): Promise<string[]> {
  if (!isAnthropicConfigured()) return [];

  const system = `You review a Trailhead intake form for Double Blaze. Trailhead builds
free sites with no ecommerce, no custom domain, no booking, no dues, no integrations,
max 5 pages. Your job is to detect when the customer's answers imply they need something
outside that scope, even if they did not ask directly.

Return a JSON array of strings. Each string is a short flag like:
"Mentions selling products online, likely needs Green Trail ecommerce"
"Wants appointment booking, needs Green Trail scheduling"
"Asks about custom domain"
"Mentions member dues, needs paid tier"

If nothing is out of scope, return an empty array [].
Return ONLY the JSON array, no prose.`;

  const raw = await callSpark({
    system,
    messages: [
      {
        role: "user",
        content: `Intake answers:\n${JSON.stringify(intake, null, 2)}\n\nScan for out-of-scope intent. Return a JSON array only.`,
      },
    ],
    maxTokens: 500,
  });

  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {
    // Try extracting array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const arr = JSON.parse(match[0]);
        if (Array.isArray(arr)) return arr.filter((s): s is string => typeof s === "string");
      } catch { /* ignore */ }
    }
  }
  return [];
}

import "server-only";
import {
  callSpark,
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
export async function draftContent(intake: Record<string, unknown>): Promise<ContentDraft | null> {
  const system = contentDraftSystemPrompt();
  const userMessage: AnthropicMessage = {
    role: "user",
    content: `Here is the completed Trailhead intake form:\n${JSON.stringify(intake, null, 2)}\n\nDraft the site content for customer approval. Return JSON only, no prose.`,
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
// Site building (stage 4, after approval): produces static HTML/CSS per page
// ---------------------------------------------------------------------------
function buildSystemPrompt(): string {
  return `You are Spark, building a Trailhead site for Double Blaze. You have the customer's
approved content (messaging, copy, colors, and structure). Build the site as static HTML
and CSS.

${BOUNDARY_BLOCK}

Return a JSON object:
{
  "pages": [
    {
      "slug": "home",
      "title": "Page Title",
      "html": "<full page HTML body content>",
      "css": "page-specific CSS if needed"
    }
  ],
  "global_css": "shared stylesheet for all pages",
  "config": {
    "footerCredit": true,
    "siteName": "string",
    "navigation": [{ "label": "string", "slug": "string" }]
  }
}

Rules:
- The HTML must be clean, semantic, and accessible.
- Use the approved color palette in the CSS.
- Every page must work as a standalone static HTML file (for export).
- The footer on every page must include: "Built by Double Blaze" linking to https://doubleblaze.solutions
- Do not include any payment forms, cart components, checkout elements, or external payment scripts.
- Do not reference a custom domain. All internal links use relative paths.
- Never use em dashes in any content. Use commas, colons, and periods.
- config.footerCredit must always be true.`;
}

export interface BuiltSite {
  pages: Array<{
    slug: string;
    title: string;
    html: string;
    css: string;
  }>;
  global_css: string;
  config: {
    footerCredit: boolean;
    siteName: string;
    navigation: Array<{ label: string; slug: string }>;
  };
}

/**
 * Build the site from approved content. Returns the built site or null.
 * Runs the structural boundary validator on the output; if violations are
 * found, re-prompts Spark once with the violations noted.
 */
export async function buildSite(
  approvedContent: ContentDraft,
  intake: Record<string, unknown>,
): Promise<{ site: BuiltSite | null; violations: BoundaryViolation[] }> {
  const system = buildSystemPrompt();
  const userMessage: AnthropicMessage = {
    role: "user",
    content: `Approved content:\n${JSON.stringify(approvedContent, null, 2)}\n\nOriginal intake:\n${JSON.stringify(intake, null, 2)}\n\nBuild the site. Return JSON only, no prose.`,
  };

  let site = await callSparkBuild(system, [userMessage]);
  if (!site) return { site: null, violations: [] };

  // Structural boundary check
  let violations = validateTrailheadBuild(site);
  if (violations.length === 0) return { site, violations: [] };

  // Re-prompt once with the violations
  const correction: AnthropicMessage = {
    role: "user",
    content: `The build has boundary violations that must be fixed:\n${violations.map((v) => `- ${v.type}: ${v.detail}`).join("\n")}\n\nRemove the violating elements and return the corrected build. Return JSON only.`,
  };
  site = await callSparkBuild(system, [userMessage, { role: "assistant", content: "I will fix these violations." }, correction]);
  if (!site) return { site: null, violations };

  violations = validateTrailheadBuild(site);
  return { site, violations };
}

async function callSparkBuild(
  system: string,
  messages: AnthropicMessage[],
): Promise<BuiltSite | null> {
  const raw = await callSpark({
    system,
    messages,
    maxTokens: 8000,
  });
  const parsed = extractJson<BuiltSite>(raw);
  if (!parsed?.pages || !parsed?.config) return null;
  return parsed;
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

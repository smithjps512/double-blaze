/**
 * A club's design tokens, turned into CSS custom properties (session 5b).
 *
 * The member area is multi-tenant, so its colours cannot be typed into a
 * stylesheet: the second club would inherit the first one's brand. Migration
 * 0025 put the tokens on `sites.theme`, `resolveTenant` reads them, and this
 * module turns them into the `:root` block the layout emits.
 *
 * ---------------------------------------------------------------------------
 * Why this file is strict
 * ---------------------------------------------------------------------------
 *
 * Everything here ends up inside a `<style>` tag. A value containing a closing
 * brace escapes its rule; one containing `</style>` escapes the element
 * entirely. So nothing is interpolated on trust:
 *
 *  - A colour must be a hex triple. Not "any CSS colour", because `red;}` is
 *    also a valid-looking string and the set of things that parse as a colour
 *    is much larger than the set worth allowing.
 *  - A font stack is checked character by character against what a font stack
 *    actually needs, which is letters, digits, spaces, quotes, hyphens, and
 *    commas. Nothing else.
 *  - Anything that fails falls back to the platform default rather than being
 *    dropped, so a club with one bad token gets a working page rather than an
 *    unstyled one.
 *
 * Today only Double Blaze staff and a club's own administrators can write that
 * column, so this is defence in depth rather than the only thing standing
 * between a member and a stylesheet. It stops being defence in depth the moment
 * somebody builds a theme editor into the admin console, which is why the check
 * lives here and has a test rather than being a comment in a route.
 *
 * Pure and framework-free, like the other modules in this directory.
 */

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  accent: string;
  muted: string;
}

export interface ThemeFonts {
  body: string;
  heading: string;
}

export interface Theme {
  colors: ThemeColors;
  fonts: ThemeFonts;
}

/**
 * What a club gets when it has no theme of its own.
 *
 * Deliberately neutral rather than Electric Grid's. A new club on the platform
 * with no design work done yet should look unfinished in a plain way, not look
 * like somebody else's brand.
 */
export const DEFAULT_THEME: Theme = {
  colors: {
    background: "#ffffff",
    text: "#1a1a1a",
    primary: "#1f2933",
    accent: "#3d7a99",
    muted: "#6b7480",
  },
  fonts: {
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    heading: 'Georgia, "Times New Roman", serif',
  },
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * A font stack, or nothing.
 *
 * Letters, digits, spaces, quotes, hyphens, commas, and full stops, which is
 * everything a family name and a fallback list need and nothing that can end a
 * declaration or a rule. Length capped because a stack is a handful of names.
 */
const FONT_STACK = /^[A-Za-z0-9 ,._'"-]{1,200}$/;

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX.test(value.trim()) ? value.trim().toLowerCase() : fallback;
}

function fontStack(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return FONT_STACK.test(trimmed) ? trimmed : fallback;
}

/**
 * Read whatever is on the row into a theme that is safe to render.
 *
 * Never throws and never returns a partial theme. A club with three good tokens
 * and two bad ones gets three of its own and two defaults, which degrades in
 * the direction of a usable page.
 */
export function resolveTheme(raw: unknown): Theme {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const colors = (source.colors && typeof source.colors === "object" ? source.colors : {}) as Record<
    string,
    unknown
  >;
  const fonts = (source.fonts && typeof source.fonts === "object" ? source.fonts : {}) as Record<
    string,
    unknown
  >;

  return {
    colors: {
      background: color(colors.background, DEFAULT_THEME.colors.background),
      text: color(colors.text, DEFAULT_THEME.colors.text),
      primary: color(colors.primary, DEFAULT_THEME.colors.primary),
      accent: color(colors.accent, DEFAULT_THEME.colors.accent),
      muted: color(colors.muted, DEFAULT_THEME.colors.muted),
    },
    fonts: {
      body: fontStack(fonts.body, DEFAULT_THEME.fonts.body),
      heading: fontStack(fonts.heading, DEFAULT_THEME.fonts.heading),
    },
  };
}

/**
 * The `:root` block for a club.
 *
 * The variable names match what globals.css consumes. Two of them are derived
 * rather than stored, because a line colour and a wash that are picked
 * independently of the brand always end up slightly wrong against it:
 *
 *  - `--line` and `--wash` are the primary colour at very low opacity, so every
 *    border and every panel is a tint of the club's own navy rather than a grey
 *    that happens to sit near it.
 *
 * Passing the font family names in from the caller lets the layout hand over
 * the self-hosted faces next/font generated, so the stack in the database acts
 * as the fallback rather than as the only instruction.
 */
export function themeCss(
  theme: Theme,
  loaded?: { body?: string; heading?: string },
): string {
  const bodyStack = [loaded?.body, theme.fonts.body].filter(Boolean).join(", ");
  const headingStack = [loaded?.heading, theme.fonts.heading].filter(Boolean).join(", ");

  return [
    ":root{",
    `--bg:${theme.colors.background};`,
    `--ink:${theme.colors.text};`,
    `--navy:${theme.colors.primary};`,
    `--green:${theme.colors.accent};`,
    `--muted:${theme.colors.muted};`,
    `--line:color-mix(in srgb, ${theme.colors.primary} 16%, #ffffff);`,
    `--wash:color-mix(in srgb, ${theme.colors.primary} 4%, #ffffff);`,
    `--sans:${bodyStack};`,
    `--serif:${headingStack};`,
    "}",
  ].join("");
}

/**
 * The one-word summary of a club, for a browser tab.
 *
 * Every tab said "Members" until this session, which is what a page title says
 * when nobody has thought about it. The club goes second because a tab strip
 * truncates from the right and the page is the part that tells them apart.
 */
export function pageTitle(page: string | null | undefined, club: string): string {
  const name = (club ?? "").trim() || "Members";
  const section = (page ?? "").trim();
  return section ? `${section}: ${name}` : name;
}

import { BRAND } from "./brand";
import { HEADQUARTERS, PRACTICE_AREAS } from "./practice";

/**
 * Resolves the canonical site URL used for metadataBase, canonical/OG tags,
 * sitemap, and robots. Order:
 *   1. NEXT_PUBLIC_SITE_URL (set this once the real domain is live)
 *   2. Vercel's production domain, then the per-deployment URL (auto-injected)
 *   3. localhost for local dev
 * Using a function with trimming guards against an empty-string env var, which
 * would otherwise break `new URL(SITE_URL)`.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return `https://${vercelProd}`;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const NAV_LINKS = [
  { href: "/practice-areas", label: "Practice areas" },
  { href: "/how-we-work", label: "How we work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/government", label: "Government" },
  { href: "/about", label: "About" },
] as const;

/** The intake: "tell us about your needs", leading to a free discovery call. */
export const INTAKE_HREF = "/start-a-project";
export const INTAKE_LABEL = "Tell us your needs";

/** Organization JSON-LD for the program management positioning. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BRAND.name,
    description: BRAND.legalLine,
    url: SITE_URL,
    email: BRAND.email,
    areaServed: { "@type": "Country", name: "United States" },
    address: {
      "@type": "PostalAddress",
      addressLocality: HEADQUARTERS.city,
      addressRegion: HEADQUARTERS.state,
      addressCountry: "US",
    },
    knowsAbout: PRACTICE_AREAS.map((p) => p.title).concat("Program management"),
  };
}

/**
 * Routes that render without the company's header and footer.
 *
 * A student team's showcase site sits inside this application but is not part
 * of this company's website, and wrapping it in Double Blaze chrome would tell
 * a thirteen year old that what they made is a page on their teacher's site
 * rather than a site of their own. It is theirs, so it renders as itself.
 */
const BARE_ROUTES = ["/trail-crew/classic-cars", "/trail-crew/yamal"];

export function isBareRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return BARE_ROUTES.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

import { BRAND } from "./brand";

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
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

/** LocalBusiness JSON-LD (spec: Sprint 1 requires LocalBusiness schema).
 * Area served per the copy deck SEO section. */
export function localBusinessJsonLd() {
  const cities = [
    "Blacksburg",
    "Christiansburg",
    "Radford",
    "Roanoke",
    "Martinsville",
    "Danville",
  ];
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND.name,
    description:
      "Veteran-owned technology company serving the New River Valley, Roanoke Valley, and Martinsville/Danville. We build websites, apps, and digital solutions that help local businesses grow.",
    url: SITE_URL,
    email: BRAND.email,
    areaServed: [
      ...cities.map((name) => ({ "@type": "City", name })),
      { "@type": "AdministrativeArea", name: "New River Valley" },
    ],
    address: {
      "@type": "PostalAddress",
      addressRegion: "VA",
      addressCountry: "US",
    },
    knowsAbout: [
      "Web development",
      "Mobile and web app development",
      "Social and digital marketing",
      "Technology consulting",
    ],
  };
}

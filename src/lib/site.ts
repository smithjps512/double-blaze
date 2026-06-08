import { BRAND } from "./brand";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://doubleblaze.solutions";

export const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

/** LocalBusiness JSON-LD (spec: Sprint 1 requires LocalBusiness schema). */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BRAND.name,
    description: BRAND.tagline,
    url: SITE_URL,
    email: BRAND.email,
    areaServed: { "@type": "State", name: "Virginia" },
    address: {
      "@type": "PostalAddress",
      addressRegion: "VA",
      addressCountry: "US",
    },
    knowsAbout: [
      "Web design",
      "Ecommerce",
      "Workflow automation",
      "Business analytics dashboards",
      "AI content",
    ],
  };
}

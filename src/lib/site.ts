import { BRAND } from "./brand";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://doubleblaze.solutions";

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

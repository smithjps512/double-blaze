/**
 * Regions as data (task: multi-region support). This is the zero-secrets source
 * of truth for the public storefront: the region selector, region pages, and
 * sitemap all render from here so the marketing site builds and runs with no
 * Supabase project attached. It mirrors the `regions` table (migration 0003);
 * when Supabase IS configured, src/lib/regions-db.ts reads the table and lets an
 * admin override `status` (the readiness gate) without a redeploy.
 *
 * A region is shown publicly only when `enabled` (the DB `active` flag). Only
 * `status === "active"` regions are indexable and linkable; `coming_soon`
 * regions render an interest-capture form.
 *
 * Lead display copy (name, photo, bio) lives here as marketing content; the DB
 * `lead_user_id` is the operational link used to assign and scope work.
 */

export type RegionStatus = "active" | "coming_soon";

export interface RegionLead {
  /** Display name shown on the region page. */
  name: string;
  /** Optional headshot; rendered only when present. */
  photoUrl?: string;
  /** Short bio, plainspoken (brand voice). */
  bio?: string;
}

/** Optional, region-specific social proof. Each slot renders only when present. */
export interface RegionProof {
  testimonials?: { quote: string; attribution: string }[];
  clients?: string[];
  community?: string[];
}

export interface Region {
  slug: string;
  name: string;
  status: RegionStatus;
  /** Master enable flag (DB `active`). Disabled regions are never shown. */
  enabled: boolean;
  /** Click-to-call number for the local lead, e.g. "+1-540-555-0142". */
  localPhone?: string;
  introBlurb: string;
  citiesServed: string[];
  /** Present once a lead is onboarded (active regions); absent for coming_soon. */
  lead?: RegionLead;
  proof?: RegionProof;
}

/** The home region. The selector defaults here; it is active to start. */
export const HOME_REGION_SLUG = "new-river-roanoke";

/**
 * The four seeded regions (task item 1). Status here is the seed/default; when
 * Supabase is configured the DB value wins (so the readiness toggle takes
 * effect). Only the home region starts active.
 */
export const REGIONS: Region[] = [
  {
    slug: "new-river-roanoke",
    name: "New River & Roanoke Valleys",
    status: "active",
    enabled: true,
    introBlurb:
      "Our home region. Enterprise-grade technology, built right here at home, by neighbors invested in the valley's success.",
    citiesServed: [
      "Blacksburg",
      "Christiansburg",
      "Radford",
      "Salem",
      "Roanoke",
      "Martinsville",
      "Danville",
    ],
    lead: {
      name: "James",
      bio: "Double Blaze's founding project lead. Two decades building digital products for some of the world's biggest brands, now put to work for businesses across the New River and Roanoke valleys.",
    },
  },
  {
    slug: "central-texas",
    name: "Central Texas",
    status: "active",
    enabled: true,
    introBlurb:
      "Enterprise-grade technology, delivered across Central Texas by a lead who knows the area, from Austin to Waco.",
    citiesServed: [
      "Austin",
      "Round Rock",
      "Georgetown",
      "San Marcos",
      "Temple",
      "Waco",
    ],
    lead: {
      name: "David Nelson",
      bio: "David Nelson leads Double Blaze across Central Texas, bringing enterprise-grade technology and product expertise to local businesses.",
    },
  },
  {
    slug: "south-texas",
    name: "South Texas",
    status: "active",
    enabled: true,
    introBlurb:
      "National-brand depth, delivered locally across South Texas, from San Antonio to the coast. Veteran-owned.",
    citiesServed: [
      "San Antonio",
      "Corpus Christi",
      "Laredo",
      "McAllen",
      "Brownsville",
      "Victoria",
    ],
    lead: {
      name: "Randy Behr",
      bio: "Randy Behr leads Double Blaze across South Texas, putting national-brand technology experience to work for businesses close to home.",
    },
  },
  {
    slug: "central-eastern-virginia",
    name: "Central and Eastern Virginia",
    status: "active",
    enabled: true,
    introBlurb:
      "Websites, apps, and digital solutions, delivered locally across Central and Eastern Virginia, from Richmond to the coast.",
    citiesServed: [
      "Richmond",
      "Charlottesville",
      "Williamsburg",
      "Newport News",
      "Norfolk",
      "Virginia Beach",
      "Chesapeake",
    ],
    lead: {
      name: "Moriah Yex",
      bio: "Moriah Yex leads Double Blaze across Central and Eastern Virginia, bringing enterprise-grade technology to local businesses.",
    },
  },
  {
    slug: "greater-orlando",
    name: "Greater Orlando",
    status: "active",
    enabled: true,
    introBlurb:
      "Enterprise-grade technology, delivered across Greater Orlando by a local lead invested in the area's businesses.",
    citiesServed: [
      "Orlando",
      "Kissimmee",
      "Sanford",
      "Winter Park",
      "Lake Mary",
      "Apopka",
    ],
    lead: {
      name: "Chuck Yex",
      bio: "Chuck Yex leads Double Blaze across Greater Orlando, bringing national-brand technology and product expertise to local businesses.",
    },
  },
];

/** All enabled regions (shown publicly), home region first. */
export function allRegions(): Region[] {
  return REGIONS.filter((r) => r.enabled).sort(sortHomeFirst);
}

/** Active (live) regions only: linkable and indexable. */
export function activeRegions(): Region[] {
  return allRegions().filter((r) => r.status === "active");
}

export function getRegionBySlug(slug: string): Region | undefined {
  return REGIONS.find((r) => r.slug === slug && r.enabled);
}

export function isActiveRegion(region: Region): boolean {
  return region.enabled && region.status === "active";
}

export function homeRegion(): Region {
  return getRegionBySlug(HOME_REGION_SLUG) ?? REGIONS[0];
}

function sortHomeFirst(a: Region, b: Region): number {
  if (a.slug === HOME_REGION_SLUG) return -1;
  if (b.slug === HOME_REGION_SLUG) return 1;
  return a.name.localeCompare(b.name);
}

/**
 * LocalBusiness + Service JSON-LD scoped to a region's cities served. Uses
 * service-area framing (areaServed), never a street address or map pin.
 */
export function regionJsonLd(region: Region, siteUrl: string) {
  const cities = region.citiesServed.map((name) => ({ "@type": "City", name }));
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Double Blaze Solutions — ${region.name}`,
    description: region.introBlurb,
    url: `${siteUrl}/regions/${region.slug}`,
    areaServed: cities,
    ...(region.localPhone ? { telephone: region.localPhone } : {}),
    address: { "@type": "PostalAddress", addressCountry: "US" },
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Web, app, and technology development",
        areaServed: cities,
        provider: { "@type": "Organization", name: "Double Blaze Solutions" },
      },
    },
  };
}

/**
 * Brand constants. Color tokens are from spec section 2 (mirrored in
 * tailwind.config.ts). Voice, tagline, region, and boilerplate are from the
 * brand brief (docs/brand-brief.md).
 */
export const BRAND = {
  name: "Double Blaze Solutions",
  shortName: "Double Blaze",
  // Primary tagline (brand brief).
  tagline: "Enterprise technology. New River Valley roots.",
  // Footer boilerplate (copy deck section 8 / brand brief).
  legalLine:
    "Double Blaze Solutions is a veteran-owned program management company. We lead programs in technology, people and culture, data and analytics, themed destinations and experiences, facility management, and events for businesses, government agencies, and government contractors. Clients pay for program management; what we build is theirs.",
  // Positioning line (program management brief, 2026-11-24).
  positioning: "Best-in-class program management. Everything we build is yours.",
  // Full region, and a short form for tight spaces (copy deck region note).
  region:
    "the New River Valley, Roanoke Valley, and Martinsville/Danville",
  regionShort: "the New River and Roanoke valleys",
  email: "yourteam@doubleblaze.solutions",
  colors: {
    blazeMaroon: "#630031",
    trailOrange: "#CF4420",
    impactOrange: "#B23A18",
    ridgeGreen: "#2E4A3B",
    hokieGray: "#75787B",
    stoneWhite: "#F6F4F1",
    ink: "#1C1A19",
  },
} as const;

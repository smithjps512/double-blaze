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
    "Double Blaze Solutions is a veteran-owned technology company serving the New River Valley, Roanoke Valley, and Martinsville/Danville, building websites, apps, and digital solutions that help local businesses grow and strengthen the community.",
  // Full region, and a short form for tight spaces (copy deck region note).
  region:
    "the New River Valley, Roanoke Valley, and Martinsville/Danville",
  regionShort: "the New River and Roanoke valleys",
  email: "hello@doubleblaze.solutions",
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

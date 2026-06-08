/**
 * Brand constants from the Double Blaze brand brief (spec section 2).
 * Color tokens also live in tailwind.config.ts; these mirror them for use in
 * non-Tailwind contexts (e.g. JSON-LD, theme-color meta, inline SVG).
 */
export const BRAND = {
  name: "Double Blaze Solutions",
  shortName: "Double Blaze",
  // Legal / certification framing per spec section 9 (entity firewall).
  legalLine:
    "Double Blaze Solutions LLC. A certified veteran-owned small business based in Virginia.",
  tagline: "We mark the path for small businesses going digital.",
  region: "Virginia, United States",
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

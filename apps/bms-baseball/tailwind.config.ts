import type { Config } from "tailwindcss";

/**
 * Blacksburg Middle School blue and yellow (same values as Paint Your Spot),
 * plus ballpark colors: infield dirt, outfield grass, and stitch red.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bms: { DEFAULT: "#0659A8", dark: "#04457F", deep: "#03305A", light: "#E7F0FA" },
        gold: { DEFAULT: "#FFD52E", light: "#FFF4C2", dark: "#E6B800" },
        grass: { DEFAULT: "#2F7D3B", light: "#E5F3E2" },
        dirt: { DEFAULT: "#C98B5A", light: "#F6E9DD" },
        stitch: "#D7362B",
        chalk: "#FBF8F1",
        ink: "#1B1D21",
        muted: "#5D6169",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 0 rgba(0,0,0,.06), 0 14px 32px -14px rgba(3,48,90,.35)" },
    },
  },
  plugins: [],
};

export default config;

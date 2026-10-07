import type { Config } from "tailwindcss";

/**
 * Blacksburg Middle School blue and yellow (sampled from bms.mcps.org) over a
 * parking lot: fresh asphalt, chalk, and a realtor's SOLD sign red kept for
 * small accents only.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: { DEFAULT: "#22252A", light: "#2F333A", dark: "#17191C" },
        bms: { DEFAULT: "#0659A8", dark: "#04457F", light: "#E7F0FA" },
        tape: { DEFAULT: "#FFED34", dark: "#F2DC00" },
        chalk: { DEFAULT: "#FBF8F1", dim: "#ECE7DC" },
        sold: { DEFAULT: "#D7362B", dark: "#B02A20" },
        lane: "#FFFFFF",
        sky: "#3E7CC4",
        grass: "#4E8A3E",
        ink: "#1B1D21",
        muted: "#5D6169",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        stencil: ["var(--font-stencil)", "Impact", "sans-serif"],
      },
      maxWidth: { content: "72rem" },
      boxShadow: { sign: "0 1px 0 rgba(0,0,0,.08), 0 12px 30px -12px rgba(23,25,28,.35)" },
    },
  },
  plugins: [],
};

export default config;

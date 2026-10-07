import type { Config } from "tailwindcss";

/**
 * Parking lot palette: fresh asphalt, crime scene tape yellow, chalk, and a
 * realtor's SOLD sign red. BMS colors are still a committee decision; swap
 * them in here when they land.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: { DEFAULT: "#22252A", light: "#2F333A", dark: "#17191C" },
        tape: { DEFAULT: "#F6C91C", dark: "#D9AE00" },
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

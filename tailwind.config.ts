import type { Config } from "tailwindcss";

/**
 * Brand color tokens from the Double Blaze brand brief (spec section 2).
 * These are the single source of truth for color in the UI.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blaze: {
          // Blaze Maroon - primary brand
          maroon: "#630031",
        },
        trail: {
          // Trail Orange - primary accent
          orange: "#CF4420",
        },
        impact: {
          // Impact Orange - secondary accent / hover
          orange: "#B23A18",
        },
        ridge: {
          // Ridge Green - supporting
          green: "#2E4A3B",
        },
        hokie: {
          // Hokie Stone Gray - neutral text / borders
          gray: "#75787B",
        },
        stone: {
          // Stone White - page background
          white: "#F6F4F1",
        },
        ink: "#1C1A19", // Ink - body text / dark surfaces
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;

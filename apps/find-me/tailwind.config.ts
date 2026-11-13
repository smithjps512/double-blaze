import type { Config } from "tailwindcss";

/**
 * Find Me: warm and hopeful, not clinical. Ember for action, pine for trust,
 * cream paper for the background, a little sun for highlights.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ember: { DEFAULT: "#D9481F", dark: "#B53A16", light: "#FCE9E2" },
        pine: { DEFAULT: "#1F4E4A", dark: "#153835", light: "#E3EFEC" },
        sun: { DEFAULT: "#F6C445", light: "#FDF3D6" },
        cream: { DEFAULT: "#FFF8F0", dim: "#F4EADD" },
        ink: "#1E1B18",
        muted: "#5F584F",
        line: "#E6DACB",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: { content: "72rem" },
      boxShadow: { card: "0 1px 0 rgba(30,27,24,.06), 0 10px 28px -14px rgba(30,27,24,.28)" },
    },
  },
  plugins: [],
};

export default config;

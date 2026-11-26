import type { Config } from "tailwindcss";

/**
 * Welcome to Joe's: the diner's own colors. Red from the logo, black ink,
 * warm white. Seat states use colors staff can read from across the room.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        joe: { DEFAULT: "#C42242", dark: "#9E1A35", light: "#FBE7EB" },
        ink: "#1A1414",
        cream: { DEFAULT: "#FFF8F1", dim: "#F3E9DD" },
        muted: "#6B605A",
        line: "#E5D8CB",
        open: { DEFAULT: "#1E7B4F", light: "#E3F4EA" },
        food: { DEFAULT: "#E0A100", light: "#FFF4CC" },
        bus: { DEFAULT: "#8A5A2B", light: "#F3E6D6" },
      },
      fontFamily: {
        sans: ["ui-rounded", "\"SF Pro Rounded\"", "\"Segoe UI\"", "system-ui", "sans-serif"],
        display: ["\"Arial Black\"", "\"Helvetica Neue\"", "Impact", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

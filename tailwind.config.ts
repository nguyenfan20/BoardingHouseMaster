import type { Config } from "tailwindcss";

// Palette & quy ước: .claude/skills/ui-design/references/palette.md
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F1F9F4",
          100: "#DCF0E3",
          200: "#B7E1C4",
          500: "#2CA463",
          600: "#178A54",
          700: "#106B41",
          900: "#0B4A2C",
        },
        neutral: {
          50: "#FAFAF9",
          100: "#F3F3F1",
          200: "#E4E4E1",
          400: "#A3A29E",
          600: "#57564F",
          900: "#1C1B18",
        },
        warning: { 50: "#FEF3E2", 600: "#B45309" },
        error: { 50: "#FEF2F2", 600: "#DC2626" },
        info: { 50: "#EFF4FF", 600: "#2563EB" },
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

// Palette & quy ước: .claude/skills/ui-design/references/palette.md
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F7F2",
          100: "#E6EBDE",
          200: "#CCD6BD",
          400: "#99AD7A",
          500: "#7D9363",
          600: "#546B41",
          700: "#435634",
          900: "#2E3B24",
        },
        neutral: {
          50: "#FFF8EC",
          100: "#FBF1E2",
          200: "#DCCCAC",
          400: "#BBAD92",
          600: "#635C4D",
          900: "#1A1915",
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

# Palette & Tailwind tokens

Single source of truth for color. Always consume colors through these token names
(`brand-*`, `neutral-*`, `warning-*`, `error-*`, `info-*`) — never hardcode a hex value in a
component, and never reach for Tailwind's built-in `green-*`/`gray-*`/`red-*` scale, so
retuning the palette later only ever means editing this file + `tailwind.config.ts`.

## Brand green (`brand-*`)

Primary/action color. Chosen to be a fresher, slightly more muted green than Tailwind's
stock `green-600` so it doesn't read as "default Bootstrap success color."

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#F1F9F4` | Page-level tinted backgrounds (e.g. a highlighted stat card) |
| `brand-100` | `#DCF0E3` | Badge/pill backgrounds, hover background for ghost buttons on brand elements |
| `brand-200` | `#B7E1C4` | Borders on brand-tinted surfaces |
| `brand-500` | `#2CA463` | Icons, links, focus ring color |
| `brand-600` | `#178A54` | **Primary button fill, active nav item, primary text links** |
| `brand-700` | `#106B41` | Hover/active state for primary buttons |
| `brand-900` | `#0B4A2C` | Text-on-brand-50 when you need strong contrast (rare) |

## Neutrals (`neutral-*`)

All body text, borders, and non-brand backgrounds. This is the workhorse scale — most of
any screen should be neutral, with brand green reserved for the one or two things that
should draw the eye (see SKILL.md §1, "one accent per screen").

| Token | Hex | Use |
|---|---|---|
| `neutral-50` | `#FAFAF9` | App background (behind cards) |
| `neutral-100` | `#F3F3F1` | Subtle section backgrounds, table row hover |
| `neutral-200` | `#E4E4E1` | Default border color |
| `neutral-400` | `#A3A29E` | Placeholder text, disabled text |
| `neutral-600` | `#57564F` | Secondary body text, labels |
| `neutral-900` | `#1C1B18` | Primary body text, headings |

## Semantic colors

Kept visually distinct from brand green so a status badge is never ambiguous with "this is
just another green thing."

| Purpose | Token | Hex | Notes |
|---|---|---|---|
| Success | reuse `brand-600` / `brand-50` | — | "Paid", "Approved" badges reuse brand green — a *good* status legitimately gets to be green |
| Warning | `warning-600` / `warning-50` | `#B45309` / `#FEF3E2` | "Pending" / "Unpaid" badges — amber, not green, not red |
| Error | `error-600` / `error-50` | `#DC2626` / `#FEF2F2` | "Rejected", form validation errors |
| Info | `info-600` / `info-50` | `#2563EB` / `#EFF4FF` | Rare — informational banners only, don't use for actions |

## `tailwind.config.ts`

Paste into the existing `theme.extend.colors` in `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

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
        DEFAULT: "0.5rem", // rounded-lg is the house default, see SKILL.md §1
      },
    },
  },
  plugins: [],
};

export default config;
```

## Badge status → color mapping

Keep this mapping consistent everywhere a status badge appears (extra_fees.status,
invoices.status):

| Status | Token | Vietnamese label |
|---|---|---|
| `approved` / `paid` | `brand-50` bg, `brand-700` text | "Đã duyệt" / "Đã thanh toán" |
| `pending` / `unpaid` | `warning-50` bg, `warning-600` text | "Chờ duyệt" / "Chưa thanh toán" |
| `rejected` | `error-50` bg, `error-600` text | "Từ chối" |

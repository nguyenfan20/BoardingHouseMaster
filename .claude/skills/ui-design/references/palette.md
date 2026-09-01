# Palette & Tailwind tokens

Single source of truth for color. Always consume colors through these token names
(`brand-*`, `neutral-*`, `warning-*`, `error-*`, `info-*`) — never hardcode a hex value in a
component, and never reach for Tailwind's built-in `green-*`/`gray-*`/`red-*` scale, so
retuning the palette later only ever means editing this file + `tailwind.config.ts`.

## Brand palette — chosen by the project owner (2026-08-31)

Four colors were specified directly: primary `#546B41` (dark olive green) and three
supporting tones `#99AD7A` (sage), `#DCCCAC` (tan), `#FFF8EC` (cream). This reads warmer and
earthier than a typical SaaS green — more "boarding house / lived-in" than "tech dashboard."
Every other step in the scale below is *derived* from these four (documented so it's
reproducible, not arbitrary): the `brand-*` darker/lighter steps are simple tint/shade mixes
of the primary and secondary green, and the `neutral-*` scale reuses the tan/cream instead of
cool grays so borders and backgrounds stay in the same warm family as the brand color.

### `brand-*` (greens)

| Token | Hex | Source | Use |
|---|---|---|---|
| `brand-50` | `#F5F7F2` | 90% white + 10% `#99AD7A` | Page-level tinted backgrounds (e.g. a highlighted stat card) |
| `brand-100` | `#E6EBDE` | 75% white + 25% `#99AD7A` | Badge/pill backgrounds, hover background for ghost buttons on brand elements |
| `brand-200` | `#CCD6BD` | 50% white + 50% `#99AD7A` | Borders on brand-tinted surfaces |
| `brand-400` | `#99AD7A` | **given directly** | Secondary accent — active nav background, softer badges |
| `brand-500` | `#7D9363` | 60% `#99AD7A` + 40% `#546B41` | Icons, links, focus ring color |
| `brand-600` | `#546B41` | **given directly — PRIMARY** | Primary button fill, active nav item, primary text links |
| `brand-700` | `#435634` | `#546B41` darkened 20% | Hover/active state for primary buttons |
| `brand-900` | `#2E3B24` | `#546B41` darkened 45% | Text-on-brand-50 when you need strong contrast (rare) |

### `neutral-*` (warm, not cool gray)

| Token | Hex | Source | Use |
|---|---|---|---|
| `neutral-50` | `#FFF8EC` | **given directly (cream)** | App background (behind cards) |
| `neutral-100` | `#FBF1E2` | 85% `#FFF8EC` + 15% `#DCCCAC` | Subtle section backgrounds, table row hover |
| `neutral-200` | `#DCCCAC` | **given directly (tan)** | Default border color |
| `neutral-400` | `#BBAD92` | `#DCCCAC` darkened 15% | Placeholder text, disabled text |
| `neutral-600` | `#635C4D` | `#DCCCAC` darkened 55% | Secondary body text, labels |
| `neutral-900` | `#1A1915` | `#DCCCAC` darkened 88% | Primary body text, headings |

Cards stay pure `bg-white` (not a neutral token) — white-on-cream is what gives cards their
subtle lift off the page background; don't swap card backgrounds to `neutral-50` or they'll
merge into the page.

## Semantic colors

Kept visually distinct from the brand greens so a status badge is never ambiguous with "this
is just another green thing." Not derived from the 4 brand colors on purpose — these need to
read as functionally different hues (amber/red/blue), not more shades of olive.

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

## Inline SVG illustrations

Illustrations (`components/illustrations.tsx`) use hardcoded hex fills, not Tailwind classes
(SVG `fill`/`stroke` attributes don't resolve Tailwind's CSS variables the same way). When
retuning the palette, update both this file's table above **and** the hex values inside
`components/illustrations.tsx` — search for the old hex values to find every spot. Current
mapping used there: `#F5F7F2`→brand-50 shapes, `#E6EBDE`→brand-100 shapes, `#CCD6BD`→brand-200
outlines, `#7D9363`→brand-500 accents, `#546B41`→brand-600 primary strokes/fills,
`#FFF8EC`/`#FBF1E2`→neutral-50/100 "paper" shapes, `#DCCCAC`→neutral-200 outlines.

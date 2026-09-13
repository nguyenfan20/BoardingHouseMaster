---
name: ui-design
description: >
  Design system and UI conventions for BoardingHouseMaster (Next.js 14 App Router +
  Tailwind CSS + shadcn/ui) — a Vietnamese boarding-house management app with admin and
  tenant portals. Use this skill any time you design, build, restyle, or review any page,
  component, or screen in this project, including when the user only says things like
  "làm UI cho trang X", "style lại cái này", "thiết kế giao diện", "màu sắc dùng gì",
  "làm responsive", "thêm empty state", or asks for a dashboard/form/table/invoice/QR
  screen — even if they don't mention "design system" explicitly. Also consult it before
  writing any Tailwind classes, any `tailwind.config.ts` color/token change, or any new
  shadcn/ui component variant in this repo, so output stays consistent with the house
  style: modern minimal, warm olive-green palette, claymorphic hero sections, flat
  illustrations, mobile-first responsive layout.
---

# UI Design — BoardingHouseMaster

House style for this project, decided by the project owner. The goal is a calm, modern,
minimal admin/tenant web app — clean breathing room, a warm olive-green/tan/cream brand
palette, claymorphic hero sections for visual warmth and personality, and hand-drawn-
feeling flat illustrations instead of stock photos or 3D renders.

Read `references/palette.md` before writing any color-related Tailwind classes or editing
`tailwind.config.ts` — it has the full hex palette and the ready-to-paste Tailwind config.
Read `references/components.md` before building buttons, inputs, tables, empty states, or
illustrations — it has copy-pasteable patterns already themed to this palette.

---

## 1. Aesthetic: modern minimal

The "modern minimal" style for this project means clarity through restraint — every
element earns its place. Less decoration, more hierarchy through space, scale, and color.

- **White space is structure.** Prefer spacing (`gap-6`, `p-6`, `space-y-4`) and subtle
  background shifts (`bg-neutral-50` vs `bg-white`) to separate sections. Borders are a
  last resort — when you do need one, use a single `border-neutral-200` line; no double
  borders, no stacked shadows.
- **Restrained shadows.** `shadow-sm` only when something genuinely floats above the
  surface (modal, dropdown, floating action button). Dashboard cards on a light background
  need nothing heavier than a `border-neutral-200`. Shadow is depth, not decoration.
- **Precise type scale.** This is a data-heavy admin tool, not a marketing site:
  - Body / table / form labels: `text-sm` (14 px)
  - Prose paragraphs: `text-base`
  - Section headings step up one size at a time: `text-lg` → `text-xl` → `text-2xl`
  - Page titles cap at `text-2xl font-semibold` (except hero sections — see §2)
  - Never reach for `text-4xl`+ outside a deliberately styled hero
- **One accent per screen.** Olive green (`brand-600`) is a signal, not a decoration — use
  it for the primary action, active nav state, and key metric numbers. Everything else stays
  neutral so the green actually draws the eye. Avoid green-tinting every icon/label; that
  collapses the hierarchy it's meant to create.
- **Consistent radius.** `rounded-xl` (12 px) as the default across cards, inputs, and
  buttons. Use `rounded-2xl` or `rounded-3xl` only for clay-style hero blobs and large
  decorative shapes (see §2). Never mix radii arbitrarily per component.
- **Micro-motion, not animation theatre.** Transitions are `duration-150 ease-out` for
  state changes (hover, focus). Reserve `duration-300` for layout-level transitions
  (sidebar open/close, modal enter). No infinite looping animations on functional UI.

---

## 2. Hero sections: claymorphism

Hero sections — the top "welcome" band on the admin dashboard, the login/register screens,
the tenant portal landing — use a **claymorphism** visual style to inject warmth and
personality while the rest of the UI stays minimal.

### What claymorphism means here

Claymorphism combines **soft 3-D depth** with **pastel color blobs** and **rounded-everything**
shapes to feel tactile and friendly — think inflated clay shapes, not flat or glassmorphic.
Key properties:

| Property | Value / approach |
|---|---|
| Background | Creamy base (`brand-50` / `#FFF8EC`) with one or two large soft blobs |
| Blob colors | Muted pastels from the brand palette: `brand-100`, `brand-200`, sage `#C7D9A8` |
| Blob shape | `border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%` — asymmetric organic curve |
| Depth shadow | Multi-layer: `box-shadow: 6px 6px 12px rgba(84,107,65,.15), inset 2px 2px 6px rgba(255,255,255,.7)` |
| Highlight | Subtle white glint on top-left edge via an inset shadow |
| Cards / pills | Large radii `rounded-3xl`, creamy fill `bg-white/70` — solid soft fills, no backdrop-blur |
| Typography | Hero heading may step up to `text-3xl font-bold` or `text-4xl font-extrabold`, neutral-900 |
| Illustrations | Flat SVG placed inside or beside the clay blob, never on a plain white card |

### Implementation recipe (Tailwind + inline style)

```tsx
{/* Hero section wrapper */}
<section className="relative overflow-hidden rounded-3xl bg-brand-50 px-8 py-12 md:px-16 md:py-20">

  {/* Blob 1 — large background shape */}
  <div
    className="pointer-events-none absolute -top-16 -left-12 h-72 w-72 bg-brand-100 opacity-70"
    style={{
      borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
      boxShadow: "6px 6px 12px rgba(84,107,65,.12), inset 2px 2px 6px rgba(255,255,255,.65)",
    }}
  />

  {/* Blob 2 — smaller accent blob */}
  <div
    className="pointer-events-none absolute -bottom-10 right-8 h-48 w-48 bg-brand-200 opacity-50"
    style={{
      borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
      boxShadow: "4px 4px 10px rgba(84,107,65,.10), inset 1px 1px 4px rgba(255,255,255,.6)",
    }}
  />

  {/* Content */}
  <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-brand-600">
        Quản lý nhà trọ
      </p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">
        Xin chào, <span className="text-brand-600">chủ nhà</span> 👋
      </h1>
      <p className="mt-2 max-w-md text-base text-neutral-500">
        Tổng quan hoạt động hôm nay của bạn.
      </p>
    </div>
    {/* Flat SVG illustration beside text */}
    <div className="max-w-[180px] shrink-0">{/* inline SVG here */}</div>
  </div>
</section>
```

### Rules for clay hero sections

1. **One hero per page.** The claymorphic section is the opening anchor of the page. Below
   it, the rest of the page reverts to clean minimal cards and tables.
2. **Two blobs maximum.** One large (60-80 % of hero height), one small accent. More than
   two makes the background noisy.
3. **Pastels only.** Blobs stay within the `brand-50` / `brand-200` range. Never use a
   saturated `brand-600` blob — that kills the softness.
4. **No glassmorphism mix.** Don't add `backdrop-blur` or `bg-white/10` inside a clay
   section. Clay uses solid soft fills and layered `box-shadow` for depth, not transparency.
5. **Vary blob shapes per screen.** Rotate the `border-radius` percentages between pages so
   each screen has its own organic shape, but keep the shadow recipe consistent.
6. **Mobile sizing.** Reduce blob sizes by ~40 % on small screens (`h-28 w-28` instead of
   `h-72 w-72`). Keep the hero `py` at `py-10` minimum so it reads as a hero, not a banner.

---

## 3. Color

Full palette + Tailwind config is in `references/palette.md`. Summary: primary olive green
`brand-600` (#546B41) for primary actions and active states, sage `brand-400` (#99AD7A) as
the secondary accent, `brand-50`/`brand-100` for light green-tinted backgrounds and clay
blobs, a **warm** neutral scale built from tan `#DCCCAC` (borders) and cream `#FFF8EC`
(page background) instead of cool grays, and separate semantic colors for warning/error so
they never get confused with the brand green (an "error" or "pending" badge must never
accidentally read as another shade of green).

Always reference colors through the `brand-*` and `neutral-*` Tailwind tokens defined in
`tailwind.config.ts` (see palette.md) — don't hardcode hex values or reach for Tailwind's
default `green-*`/`gray-*` scale, so the palette stays a single source of truth that's easy
to retune later.

---

## 4. Illustrations

Use flat, geometric, undraw.co-style illustrations (2-4 flat color fills, no gradients, no
outlines-as-3D, no photos) recolored into the `brand-*` green palette plus one or two
neutral tones. Place them:
- Inside clay hero sections (beside or overlapping the heading)
- Empty states (no rooms yet, no invoices yet, no notifications)
- Login / register screens

Not scattered decoratively across every page.

This environment can't reliably fetch external illustration assets at build time, so the
default approach is **hand-built inline SVG**, sized to sit inside a `max-w-[240px]`
container. `references/components.md` has a ready-to-use `<EmptyState>` pattern plus two
example inline SVG illustrations (empty room list, empty invoice list) in the brand palette
— copy their construction (a handful of overlapping rounded shapes + one accent circle)
when you need a new one rather than inventing a new visual language per screen.

---

## 5. Layout shells

This app has two distinct audiences with different device habits — design each shell for
its primary device, then make it work on the other:

- **Admin shell** (`app/(admin)/layout.tsx`) — desktop-first, since a landlord doing books
  is usually at a laptop. Left sidebar nav (`w-64`) with sections Dashboard / Rooms /
  Billing Config / Bank Info / Extra Fees Review, page content in a `max-w-7xl` container.
  Below `md`, the sidebar collapses into a slide-in drawer opened by a hamburger button in
  a sticky top bar — never permanently hide admin nav items on mobile, just move them
  behind the drawer.
- **Tenant shell** (`app/(tenant)/layout.tsx`) — mobile-first, since a tenant is checking
  their bill from their phone. Sticky top bar with the app name/logo + a notification bell,
  simple horizontal tabs or a bottom nav bar for Hóa đơn / Nhập chỉ số / Phụ phí, content in
  a single `max-w-2xl` column that centers on wider screens. Don't build a sidebar for the
  tenant shell — it's the wrong pattern for a 2-3 screen mobile-first flow.

See `references/components.md` for the shell skeletons.

---

## 6. Responsive rules (mobile-first)

Write every layout mobile-first (unprefixed classes = smallest screen, add `sm:`/`md:`/`lg:`
to expand), and check these concrete breakpoints:

| Breakpoint | Admin shell | Tenant shell | Data tables |
|---|---|---|---|
| `< 640px` (base) | Sidebar hidden behind drawer, single-column forms | Bottom nav bar, single column, `max-w` full width with `px-4` | Tables **collapse to a stacked card per row** — never horizontal-scroll a table on mobile |
| `sm:` 640px | Same as base, forms can go 2-column for short fields (name/phone) | Content gets `px-6`, still single column | Cards get a bit more padding |
| `md:` 768px | Sidebar becomes visible as fixed column, hamburger disappears | Top tabs replace bottom nav if you added one | Table switches from cards to a real `<table>` |
| `lg:`+ 1024px | Content area gets `max-w-7xl`, dashboard stat cards go to a 3-4 column grid | Content centers with `max-w-2xl`, side padding grows | Table gets comfortable column padding |

Data table → card collapse is the one pattern every admin list page needs (rooms list,
extra-fees review queue, invoices list). Don't ship a `<table>` that only handles overflow
with `overflow-x-auto` — on a phone that produces a tiny unreadable table the user has to
pinch-zoom, which fails the "tenant checks their bill on their phone" use case this app is
built around. Use the card-collapse pattern from `references/components.md` instead.

---

## 7. Components & states

Base all interactive components (button, input, select, badge, table) on shadcn/ui so
behavior (focus trapping, keyboard nav, accessibility) is solid, then theme them to the
`brand-*` palette per `references/palette.md` instead of shadcn's default slate/zinc theme.

Every button and input needs all of these states defined, not just default+hover — a
half-finished component (works on hover, forgets focus-visible) is worse than a plain
unstyled one because it looks broken instead of unstyled:

| State | Spec |
|---|---|
| **default** | `brand-600` fill for primary buttons; `neutral-200` border for secondary/inputs |
| **hover** | One step darker (`brand-700`) for primary; `neutral-50` background for secondary/ghost |
| **active/pressed** | One step darker still, or `scale-[0.98]` for tactile feedback |
| **focus-visible** | `ring-2 ring-brand-500 ring-offset-2` — never remove without replacing |
| **disabled** | `opacity-50 cursor-not-allowed`, no hover/active changes underneath |
| **loading** | Swap label for a small spinner, keep button width stable so layout doesn't jump |
| **empty** | Illustration (§4) + one-sentence explanation + primary action where relevant |
| **error** (forms) | Red border + inline message under the field; red (`error-600`) must never read as green |

`references/components.md` has full markup for buttons, inputs, badges, the table→card
pattern, and the empty-state pattern described above — start from those instead of writing
a shadcn variant from scratch.

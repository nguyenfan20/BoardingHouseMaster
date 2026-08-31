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
  style: modern minimalism, green primary color, flat illustrations, mobile-first
  responsive layout.
---

# UI Design — BoardingHouseMaster

House style for this project, decided by the project owner. The goal is a calm, modern,
minimal admin/tenant web app that doesn't look like generic Bootstrap — generous white
space, a confident green brand color, and hand-drawn-feeling flat illustrations instead of
stock photos or 3D renders.

Read `references/palette.md` before writing any color-related Tailwind classes or editing
`tailwind.config.ts` — it has the full hex palette and the ready-to-paste Tailwind config.
Read `references/components.md` before building buttons, inputs, tables, empty states, or
illustrations — it has copy-pasteable patterns already themed to this palette.

## 1. Aesthetic: modern minimalism

- **White space over borders.** Prefer spacing (`gap-6`, `p-6`, `space-y-4`) and subtle
  background differences (`bg-neutral-50` vs `bg-white`) to separate sections, rather than
  drawing a border or shadow around everything. When you do need a boundary, use one thin
  `border-neutral-200` and nothing heavier — no double borders, no drop shadows stacked on
  borders.
- **Restrained shadows.** At most `shadow-sm` for cards that need to lift off the page
  (e.g. a modal, a dropdown). Dashboard cards on a light background usually don't need a
  shadow at all — a `border-neutral-200` is enough.
- **Type scale stays small.** This is a data-heavy admin tool, not a marketing site — don't
  reach for `text-4xl`+ outside a page hero. Body text is `text-sm` (14px) as the default
  for tables/forms, `text-base` for prose, headings step up by one Tailwind size at a time
  (`text-lg` → `text-xl` → `text-2xl`), and page titles top out around `text-2xl font-semibold`.
- **One accent per screen.** Green is the brand color, not a decoration — use it for the
  primary action, active nav state, and key numbers/badges. Everything else on the screen
  should be neutral gray/white so the green actually draws the eye. Resist the urge to
  green-tint every icon and label; that flattens the hierarchy it's supposed to create.
- **Radius**: `rounded-lg` (8px) is the default for cards, inputs, and buttons across the
  app — keep it consistent instead of mixing radii per component.

## 2. Color

Full palette + Tailwind config is in `references/palette.md`. Summary: primary green
`brand-600` (#178A54) for primary actions and active states, `brand-50`/`brand-100` for
light green backgrounds/badges, neutral grays for all text and borders, and separate
semantic colors for warning/error so they never get confused with the brand green (an
"error" or "pending" badge must never accidentally read as another shade of green).

Always reference colors through the `brand-*` and `neutral-*` Tailwind tokens defined in
`tailwind.config.ts` (see palette.md) — don't hardcode hex values or reach for Tailwind's
default `green-*`/`gray-*` scale, so the palette stays a single source of truth that's easy
to retune later.

## 3. Illustrations

Use flat, geometric, undraw.co-style illustrations (2-4 flat color fills, no gradients, no
outlines-as-3D, no photos) recolored into the `brand-*` green palette plus one or two
neutral tones. Reserve them for moments that benefit from warmth: empty states (no rooms
yet, no invoices yet, no notifications), the login/register screens, and one hero spot on
the admin dashboard — not scattered decoratively across every page.

This environment can't reliably fetch external illustration assets at build time, so the
default approach is **hand-built inline SVG**, sized to sit inside a `max-w-[240px]`
container above the empty-state text. `references/components.md` has a ready-to-use
`<EmptyState>` pattern plus two example inline SVG illustrations (empty room list, empty
invoice list) in the brand palette — copy their construction (a handful of overlapping
rounded shapes + one accent circle) when you need a new one rather than inventing a new
visual language per screen.

## 4. Layout shells

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

## 5. Responsive rules (mobile-first)

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

## 6. Components & states

Base all interactive components (button, input, select, badge, table) on shadcn/ui so
behavior (focus trapping, keyboard nav, accessibility) is solid, then theme them to the
`brand-*` palette per `references/palette.md` instead of shadcn's default slate/zinc theme.

Every button and input needs all of these states defined, not just default+hover — a
half-finished component (works on hover, forgets focus-visible) is worse than a plain
unstyled one because it looks broken instead of unstyled:

- **default** — brand-600 fill for primary buttons, neutral-200 border for secondary/inputs
- **hover** — one step darker (`brand-700`) for primary, `neutral-50` background for
  secondary/ghost buttons
- **active/pressed** — one step darker still, or a slight `scale-[0.98]` on buttons for
  tactile feedback
- **focus-visible** — a visible `ring-2 ring-brand-500 ring-offset-2` — never remove the
  focus ring without replacing it, this is an internal tool real people use with keyboards
- **disabled** — `opacity-50 cursor-not-allowed`, no hover/active changes underneath
- **loading** — for async actions (Server Action pending), swap label for a small spinner
  and keep the button's width stable so the layout doesn't jump
- **empty** — use the illustration pattern from §3, always pair the illustration with one
  sentence explaining what's missing and, where relevant, a primary action to fix it (e.g.
  empty rooms list → illustration + "Chưa có phòng nào" + "Thêm phòng" button)
- **error** (forms) — red border + a one-line message directly under the field, not just a
  toast the user might miss; keep the red (`error-600`) separate from the brand green so a
  validation error never visually reads as "still fine, still green"

`references/components.md` has full markup for buttons, inputs, badges, the table→card
pattern, and the empty-state pattern described above — start from those instead of writing
a shadcn variant from scratch.

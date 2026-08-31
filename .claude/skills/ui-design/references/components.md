# Component patterns

Copy-pasteable Tailwind/TSX patterns already themed to `references/palette.md`. Adapt props
and content, but keep the class structure and state coverage — they encode the state rules
from SKILL.md §6.

## Button (primary / secondary / ghost)

```tsx
// primary — brand fill
<button
  className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2
             text-sm font-medium text-white transition-colors
             hover:bg-brand-700 active:bg-brand-700
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
  disabled={isPending}
>
  {isPending ? <Spinner className="h-4 w-4" /> : "Lưu"}
</button>

// secondary — outline, neutral
<button
  className="inline-flex items-center justify-center rounded-lg border border-neutral-200
             bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors
             hover:bg-neutral-50 active:bg-neutral-100
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  Huỷ
</button>

// ghost — for low-emphasis actions inside tables/toolbars
<button
  className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm text-neutral-600
             transition-colors hover:bg-neutral-100 hover:text-neutral-900
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
>
  Xem chi tiết
</button>
```

Keep the button's rendered width roughly stable when swapping label → spinner (e.g. fix a
`min-w-[…]` on primary submit buttons) so the loading state doesn't cause layout shift.

## Input

```tsx
<div className="space-y-1.5">
  <label htmlFor="fee_name" className="text-sm font-medium text-neutral-900">
    Tên phụ phí
  </label>
  <input
    id="fee_name"
    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900
               placeholder:text-neutral-400
               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
               disabled:bg-neutral-50 disabled:text-neutral-400
               aria-invalid:border-error-600 aria-invalid:focus:ring-error-600"
    placeholder="VD: Wifi tháng 9"
  />
  {/* error state — only render when validation fails, directly under the field */}
  <p className="text-sm text-error-600">Vui lòng nhập tên phụ phí.</p>
</div>
```

## Status badge

```tsx
const STATUS_STYLES: Record<string, string> = {
  approved: "bg-brand-50 text-brand-700",
  paid: "bg-brand-50 text-brand-700",
  pending: "bg-warning-50 text-warning-600",
  unpaid: "bg-warning-50 text-warning-600",
  rejected: "bg-error-50 text-error-600",
};

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
  {STATUS_LABEL_VI[status]}
</span>
```

## Data table → card collapse (mobile-first)

The one pattern every admin list page (rooms, extra-fees review, invoices) should use.
Render a real `<table>` at `md:` and above, and a stacked list of cards below it — both from
the same data, toggled with Tailwind's responsive display utilities (no JS branching needed).

```tsx
function RoomsList({ rooms }: { rooms: Room[] }) {
  return (
    <>
      {/* mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {rooms.map((room) => (
          <li key={room.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900">{room.name}</span>
              <span className="text-sm text-neutral-600">{formatVnd(room.base_price)}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
              <dt>Loại phòng</dt>
              <dd className="text-right">{ROOM_TYPE_LABEL_VI[room.room_type]}</dd>
              <dt>Số người</dt>
              <dd className="text-right">{room.num_occupants}</dd>
            </dl>
          </li>
        ))}
      </ul>

      {/* md+: table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-600">
            <th className="py-2 font-medium">Phòng</th>
            <th className="py-2 font-medium">Loại phòng</th>
            <th className="py-2 font-medium">Số người</th>
            <th className="py-2 font-medium text-right">Giá thuê</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
              <td className="py-3 font-medium text-neutral-900">{room.name}</td>
              <td className="py-3 text-neutral-600">{ROOM_TYPE_LABEL_VI[room.room_type]}</td>
              <td className="py-3 text-neutral-600">{room.num_occupants}</td>
              <td className="py-3 text-right text-neutral-900">{formatVnd(room.base_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

## Empty state + inline SVG illustration

```tsx
function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  illustration: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
      <div className="mb-6 w-full max-w-[240px]">{illustration}</div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

Illustration construction rule of thumb: 3-5 overlapping flat shapes (rounded rects,
circles) in `brand-50`/`brand-100`/`brand-500` plus `neutral-200` for a "paper" shape, and
one small accent circle in `brand-600`. Keep it geometric, not literal/detailed.

```tsx
// example: "no rooms yet" — a simple flat house shape
function NoRoomsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="80" width="160" height="70" rx="8" fill="#F1F9F4" />
      <rect x="50" y="60" width="100" height="90" rx="6" fill="#FAFAF9" stroke="#E4E4E1" strokeWidth="2" />
      <path d="M40 65 L100 20 L160 65" stroke="#178A54" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="85" y="100" width="30" height="50" rx="3" fill="#DCF0E3" />
      <circle cx="150" cy="45" r="10" fill="#2CA463" />
    </svg>
  );
}

// example: "no invoices yet" — a flat document + checkmark
function NoInvoicesIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="55" y="20" width="90" height="120" rx="8" fill="#FAFAF9" stroke="#E4E4E1" strokeWidth="2" />
      <rect x="70" y="40" width="60" height="8" rx="4" fill="#DCF0E3" />
      <rect x="70" y="58" width="60" height="8" rx="4" fill="#F3F3F1" />
      <rect x="70" y="76" width="40" height="8" rx="4" fill="#F3F3F1" />
      <circle cx="145" cy="115" r="26" fill="#178A54" />
      <path d="M133 115 L142 124 L158 106" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
```

## Admin shell skeleton

```tsx
// app/(admin)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      {/* sidebar: hidden < md, fixed column >= md. Mobile drawer is a client component
          (e.g. components/admin-sidebar.tsx) that reuses this same nav list. */}
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-4 md:block">
        <AdminNav />
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <MobileMenuButton /> {/* opens AdminNav in a Sheet/drawer */}
          <span className="font-semibold text-neutral-900">BoardingHouseMaster</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
```

## Tenant shell skeleton

```tsx
// app/(tenant)/layout.tsx
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-16 md:pb-0">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
        <span className="font-semibold text-neutral-900">BoardingHouseMaster</span>
        <NotificationBell />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">{children}</main>
      {/* bottom nav only on mobile; becomes a top tab row md+ if needed */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white md:hidden">
        <TenantNavItem href="/invoices" label="Hóa đơn" />
        <TenantNavItem href="/meter-input" label="Nhập chỉ số" />
        <TenantNavItem href="/extra-fees" label="Phụ phí" />
      </nav>
    </div>
  );
}
```

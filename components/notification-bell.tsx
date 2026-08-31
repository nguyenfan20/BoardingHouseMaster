// TODO: gắn với bảng notifications (docs/NOTIFICATIONS.md) khi có Supabase project thật —
// hiện chỉ hiển thị icon tĩnh, chưa có badge số lượng chưa đọc.
export function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Thông báo"
      className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

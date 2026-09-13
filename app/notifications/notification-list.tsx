"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDateTimeLabel } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  /** Đường dẫn đích suy ra từ related_table/related_id ở phía server, null nếu không có. */
  href: string | null;
}

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.is_read);

  function handleOpen(item: NotificationRow) {
    startTransition(async () => {
      if (!item.is_read) await markNotificationRead(item.id);
      if (item.href) router.push(item.href);
    });
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => void markAllNotificationsRead())}
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {notifications.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleOpen(item)}
              disabled={isPending}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                item.is_read
                  ? "border-neutral-200 bg-white hover:bg-neutral-50"
                  : "border-brand-200 bg-brand-50/70 hover:bg-brand-50"
              }`}
            >
              <div className="flex items-start gap-2">
                {!item.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  {item.body && <p className="mt-0.5 text-sm text-neutral-600">{item.body}</p>}
                  <p className="mt-1 text-xs text-neutral-500">{formatDateTimeLabel(item.created_at)}</p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

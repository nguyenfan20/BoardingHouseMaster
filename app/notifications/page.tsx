import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, HOME_PATH_BY_ROLE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvitesIllustration } from "@/components/illustrations";
import type { UserRole } from "@/types";
import { NotificationList, type NotificationRow } from "./notification-list";

export const dynamic = "force-dynamic";

/** Đường dẫn đích của thông báo — khác nhau theo role vì admin/tenant có trang khác nhau. */
function targetHref(
  role: UserRole,
  relatedTable: string | null,
  relatedId: string | null
): string | null {
  switch (relatedTable) {
    case "extra_fees":
      return role === "admin" ? "/extra-fees-review" : "/extra-fees";
    case "invoices":
      return role === "admin" ? "/rooms" : relatedId ? `/invoices/${relatedId}` : "/invoices";
    case "parking_requests":
      return role === "admin" ? "/dashboard" : "/parking";
    default:
      return null;
  }
}

export default async function NotificationsPage() {
  const result = await getCurrentProfile();
  if (!result) redirect("/login");
  const role = result.profile.role;

  const supabase = await createClient();
  // RLS chỉ trả về thông báo của chính user này (docs/RLS.md § notifications).
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at, related_table, related_id")
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications: NotificationRow[] = (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    is_read: n.is_read,
    created_at: n.created_at,
    href: targetHref(role, n.related_table, n.related_id),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Thông báo</h1>
        <Link
          href={HOME_PATH_BY_ROLE[role]}
          className="text-sm font-medium text-brand-700 hover:text-brand-600"
        >
          ← Quay lại
        </Link>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          illustration={<NoInvitesIllustration />}
          title="Chưa có thông báo"
          description="Thông báo về hóa đơn, phụ phí và đăng ký gửi xe sẽ xuất hiện ở đây."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}

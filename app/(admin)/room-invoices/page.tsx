import Link from "next/link";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvoicesIllustration } from "@/components/illustrations";
import { formatMonthLabel } from "@/lib/utils";
import { SendInvoiceButton } from "./send-invoice-button";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: rooms }, { data: tenants }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, room_id, month, total_amount, status")
      .order("month", { ascending: false })
      .limit(100),
    supabase.from("rooms").select("id, name"),
    supabase.from("users").select("id, room_id").eq("role", "tenant"),
  ]);

  // Service role vì RLS chỉ cho mỗi user đọc thông báo của chính mình (docs/RLS.md § notifications).
  const { data: readNotifs } = await createServiceRoleClient()
    .from("notifications")
    .select("user_id, related_id")
    .eq("related_table", "invoices")
    .eq("is_read", true)
    .in("related_id", (invoices ?? []).map((i) => i.id));

  const roomNameById = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const readKeys = new Set((readNotifs ?? []).map((n) => `${n.related_id}:${n.user_id}`));

  const rows = (invoices ?? []).map((inv) => {
    const roomTenants = (tenants ?? []).filter((t) => t.room_id === inv.room_id);
    const seen = roomTenants.filter((t) => readKeys.has(`${inv.id}:${t.id}`)).length;
    return { ...inv, roomName: roomNameById.get(inv.room_id) ?? "Phòng đã xoá", seen, total: roomTenants.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Hóa đơn</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Xem hóa đơn của các phòng và gửi thông báo cho người thuê chưa xem.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          illustration={<NoInvoicesIllustration />}
          title="Chưa có hóa đơn nào"
          description="Hóa đơn tạo từ trang từng phòng hoặc tự động theo ngày chốt sẽ hiện ở đây."
        />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
          {rows.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/room-invoices/${inv.id}`} className="font-semibold text-neutral-900 hover:text-brand-700">
                  {inv.roomName} · Tháng {formatMonthLabel(inv.month)}
                </Link>
                <p className="mt-0.5 text-sm text-neutral-600">
                  {inv.total_amount.toLocaleString("vi-VN")} đ ·{" "}
                  {inv.total === 0 ? "Chưa có người thuê" : `Đã xem ${inv.seen}/${inv.total}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={inv.status as "paid" | "unpaid"}>{inv.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</Badge>
                <Link href={`/room-invoices/${inv.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-600">
                  Xem
                </Link>
                {inv.total > 0 && inv.seen < inv.total && <SendInvoiceButton invoiceId={inv.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

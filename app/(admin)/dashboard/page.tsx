import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { billingMonthFor } from "@/lib/billing/billing-cycle";
import { formatDateTimeLabel, formatMonthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [
    { data: rooms },
    { data: configs },
    { data: invoices },
    { count: unpaidCount },
    { count: pendingFeeCount },
    { data: parkingRequests },
  ] = await Promise.all([
    supabase.from("rooms").select("id, name").eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("billing_config").select("room_id, billing_day"),
    supabase.from("invoices").select("room_id, month"),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "unpaid"),
    supabase.from("extra_fees").select("*", { count: "exact", head: true }).in("status", ["pending", "declared"]),
    supabase
      .from("parking_requests")
      .select("id, plate_number, scheduled_at, note, room_id")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(10),
  ]);

  const roomNameById = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const billingDayByRoomId = new Map((configs ?? []).map((c) => [c.room_id, c.billing_day]));
  const invoiceMonths = new Set((invoices ?? []).map((inv) => `${inv.room_id}:${inv.month}`));

  // Phòng đã tới ngày chốt của kỳ hiện tại mà chưa có hóa đơn cho kỳ đó.
  const dueRooms = (rooms ?? [])
    .map((room) => {
      const billingDay = billingDayByRoomId.get(room.id) ?? 1;
      const month = billingMonthFor(billingDay);
      return { ...room, billingDay, month };
    })
    .filter((room) => !invoiceMonths.has(`${room.id}:${room.month}`));

  const stats = [
    { label: "Phòng đang hoạt động", value: rooms?.length ?? 0, href: "/rooms" },
    { label: "Hóa đơn chưa thanh toán", value: unpaidCount ?? 0, href: "/rooms" },
    { label: "Phụ phí chờ duyệt", value: pendingFeeCount ?? 0, href: "/extra-fees-review" },
    { label: "Phòng cần tạo hóa đơn", value: dueRooms.length, href: "/billing-config" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Tổng quan</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-neutral-200 bg-white p-6 transition-colors hover:border-brand-200"
          >
            <p className="text-sm text-neutral-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-700">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Đăng ký gửi xe của tenant — để admin sắp xếp chỗ trước */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-900">Đăng ký ra xe buổi sáng</h2>
          <Link href="/parking-requests" className="text-sm font-medium text-brand-700 hover:text-brand-600">
            Xem lịch sử →
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Tenant đăng ký biển số và thời gian đi xe ở trang Xe đi của họ. Đăng ký đã qua giờ hẹn
          chuyển sang trang Lịch sử đăng ký.
        </p>

        {!parkingRequests || parkingRequests.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Không có đăng ký nào sắp tới.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {parkingRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-neutral-900">
                    {req.plate_number}
                    <span className="ml-2 font-normal text-neutral-600">
                      {roomNameById.get(req.room_id) ?? "Phòng đã xoá"}
                    </span>
                  </p>
                  {req.note && <p className="mt-0.5 text-xs text-neutral-500">{req.note}</p>}
                </div>
                <span className="font-medium text-brand-700">{formatDateTimeLabel(req.scheduled_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nhắc tạo hóa đơn theo ngày chốt riêng của từng phòng */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Cần tạo hóa đơn</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tính theo ngày chốt tiền riêng của từng phòng (đổi ở Cấu hình tính tiền).
        </p>

        {dueRooms.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Tất cả phòng đã có hóa đơn cho kỳ hiện tại.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {dueRooms.map((room) => (
              <li
                key={room.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{room.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Kỳ {formatMonthLabel(room.month)} · chốt ngày {room.billingDay} hằng tháng
                  </p>
                </div>
                <Link
                  href={`/rooms/${room.id}`}
                  className="font-medium text-brand-700 hover:text-brand-600"
                >
                  Tạo hóa đơn
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

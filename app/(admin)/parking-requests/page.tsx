import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvitesIllustration } from "@/components/illustrations";
import { formatDateTimeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Đăng ký gửi xe cũ hơn mốc này bị xoá tự động (xem docs/SCHEMA.md § parking_requests). */
const RETENTION_DAYS = 30;

export default async function AdminParkingRequestsPage() {
  const supabase = await createClient();
  const now = Date.now();
  const cutoffIso = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // ponytail: dọn theo kiểu lazy mỗi lần admin mở trang này — đủ cho nhà trọ 1 admin, không cần
  // pg_cron/job chạy nền. Nếu sau này cần xoá đúng hạn kể cả khi không ai mở trang thì chuyển
  // sang pg_cron trong migration. RLS cho phép admin xoá mọi dòng (docs/RLS.md).
  await supabase.from("parking_requests").delete().lt("scheduled_at", cutoffIso);

  const [{ data: requests }, { data: rooms }] = await Promise.all([
    supabase
      .from("parking_requests")
      .select("id, plate_number, scheduled_at, note, room_id")
      .lt("scheduled_at", new Date(now).toISOString())
      .order("scheduled_at", { ascending: false })
      .limit(100),
    supabase.from("rooms").select("id, name"),
  ]);

  const roomNameById = new Map((rooms ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Lịch sử đăng ký xe</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Các đăng ký đã qua giờ hẹn. Đăng ký sắp tới nằm ở{" "}
            <Link href="/dashboard" className="font-medium text-brand-700 hover:text-brand-600">
              Tổng quan
            </Link>
            . Đăng ký quá {RETENTION_DAYS} ngày được xoá tự động.
          </p>
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <EmptyState
          illustration={<NoInvitesIllustration />}
          title="Chưa có lịch sử nào"
          description={`Đăng ký gửi xe của khách thuê sẽ chuyển vào đây sau khi qua giờ hẹn, và tự xoá sau ${RETENTION_DAYS} ngày.`}
        />
      ) : (
        <>
          {/* mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {requests.map((req) => (
              <li key={req.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-neutral-900">{req.plate_number}</span>
                  <span className="text-sm text-neutral-600">{formatDateTimeLabel(req.scheduled_at)}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
                  <dt>Phòng</dt>
                  <dd className="text-right">{roomNameById.get(req.room_id) ?? "Phòng đã xoá"}</dd>
                  {req.note && (
                    <>
                      <dt>Ghi chú</dt>
                      <dd className="text-right">{req.note}</dd>
                    </>
                  )}
                </dl>
              </li>
            ))}
          </ul>

          {/* md+: table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 font-medium">Biển số</th>
                <th className="py-2 font-medium">Phòng</th>
                <th className="py-2 font-medium">Thời điểm gửi</th>
                <th className="py-2 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="py-3 font-medium text-neutral-900">{req.plate_number}</td>
                  <td className="py-3 text-neutral-600">{roomNameById.get(req.room_id) ?? "Phòng đã xoá"}</td>
                  <td className="py-3 text-neutral-600">{formatDateTimeLabel(req.scheduled_at)}</td>
                  <td className="py-3 text-neutral-600">{req.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

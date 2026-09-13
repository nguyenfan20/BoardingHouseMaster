import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvitesIllustration } from "@/components/illustrations";
import { formatDateTimeLabel } from "@/lib/utils";
import { ParkingRequestForm } from "./parking-form";
import { CancelParkingButton } from "./cancel-button";

export const dynamic = "force-dynamic";

export default async function TenantParkingPage() {
  const supabase = await createClient();
  // RLS chỉ trả về đăng ký của phòng mình (docs/RLS.md § parking_requests).
  const { data: requests } = await supabase
    .from("parking_requests")
    .select("*")
    .order("scheduled_at", { ascending: true });

  const now = Date.now();
  const upcoming = (requests ?? []).filter((r) => new Date(r.scheduled_at).getTime() >= now);
  const past = (requests ?? []).filter((r) => new Date(r.scheduled_at).getTime() < now).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Gửi xe</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Đăng ký biển số và thời điểm xe đi để được sắp xếp chỗ trước.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <ParkingRequestForm />
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          illustration={<NoInvitesIllustration />}
          title="Chưa có đăng ký nào"
          description="Điền biển số và ngày giờ ở trên để được chuẩn bị chỗ."
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Sắp tới</h2>
              <ul className="space-y-2">
                {upcoming.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-xs"
                  >
                    <div>
                      <p className="font-semibold text-neutral-900">{r.plate_number}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDateTimeLabel(r.scheduled_at)}
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                    </div>
                    <CancelParkingButton id={r.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Đã qua</h2>
              <ul className="space-y-2">
                {past.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm text-neutral-600"
                  >
                    <p className="font-medium text-neutral-700">{r.plate_number}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {formatDateTimeLabel(r.scheduled_at)}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

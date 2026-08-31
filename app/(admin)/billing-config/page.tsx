import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoRoomsIllustration } from "@/components/illustrations";

export const dynamic = "force-dynamic";

const WATER_CALC_LABEL_VI: Record<string, string> = {
  per_person: "Theo đầu người",
  fixed: "Cố định",
  per_m3: "Theo khối",
};

export default async function AdminBillingConfigPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms").select("id, name").order("created_at", { ascending: true });
  const { data: configs } = await supabase.from("billing_config").select("*");
  const configByRoomId = new Map((configs ?? []).map((c) => [c.room_id, c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Cấu hình tính tiền</h1>
        <p className="mt-1 text-sm text-neutral-600">Đơn giá điện/nước áp dụng riêng cho từng phòng.</p>
      </div>

      {!rooms || rooms.length === 0 ? (
        <EmptyState
          illustration={<NoRoomsIllustration />}
          title="Chưa có phòng nào"
          description="Thêm phòng ở trang Phòng trọ trước, cấu hình tính tiền sẽ tự tạo mặc định theo loại phòng."
        />
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => {
            const cfg = configByRoomId.get(room.id);
            return (
              <li key={room.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-neutral-900">{room.name}</span>
                  <Link href={`/billing-config/${room.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-600">
                    Sửa
                  </Link>
                </div>
                {cfg && (
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600 sm:grid-cols-4">
                    <dt>Giá điện</dt>
                    <dd className="text-neutral-900">{cfg.electricity_rate.toLocaleString("vi-VN")} đ/kWh</dd>
                    <dt>Thuế/Phụ thu điện</dt>
                    <dd className="text-neutral-900">
                      {cfg.electricity_tax_percent > 0
                        ? `Thuế ${cfg.electricity_tax_percent}%`
                        : cfg.dual_meter_surcharge_percent > 0
                          ? `Phụ thu ${cfg.dual_meter_surcharge_percent}%`
                          : "Không"}
                    </dd>
                    <dt>Tính nước</dt>
                    <dd className="text-neutral-900">{WATER_CALC_LABEL_VI[cfg.water_calc_type]}</dd>
                    <dt>Tenant tự nhập chỉ số</dt>
                    <dd className="text-neutral-900">{cfg.allow_tenant_meter_input ? "Có" : "Không"}</dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

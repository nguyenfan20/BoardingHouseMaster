import { notFound } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { formatDateTimeLabel } from "@/lib/utils";
import type { WaterCalcType } from "@/types";
import { InviteManager } from "./invite-manager";
import { GenerateInvoiceSection } from "./generate-invoice-section";
import { MeterReadingSection } from "./meter-reading-section";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();

  const [
    { data: room },
    { data: config },
    { data: invites },
    { data: invoices },
    { data: accounts },
    { data: meterReadings },
    { data: waterReadings },
  ] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", roomId).single(),
    supabase
      .from("billing_config")
      .select("billing_day, has_dual_meter, water_calc_type, allow_tenant_meter_input")
      .eq("room_id", roomId)
      .maybeSingle(),
    supabase
      .from("room_invites")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false }),
    supabase
      .from("users")
      .select("id, full_name, phone, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true }),
    supabase
      .from("meter_readings")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(36), // 2 dòng/tháng nếu 2 đồng hồ → 36 đủ 12 tháng
    supabase
      .from("water_readings")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(12),
  ]);

  if (!room) notFound();

  // Email nằm ở `auth.users`, không có trong bảng `users` — lấy qua Admin API bằng service-role
  // client. Trang này đã nằm sau `requireRolePage("admin")` của layout (docs/RLS.md § Lưu ý
  // triển khai). Lỗi ở đây không được làm sập trang: thiếu email thì hiển thị "—".
  const emailById = new Map<string, string>();
  if (accounts && accounts.length > 0) {
    try {
      const { data: authUsers } = await createServiceRoleClient().auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of authUsers?.users ?? []) {
        if (u.email) emailById.set(u.id, u.email);
      }
    } catch {
      // Bỏ qua — vẫn hiển thị tên/điện thoại từ bảng `users`.
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{room.name}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {room.num_occupants} người · {room.base_price.toLocaleString("vi-VN")} đ/tháng
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Chỉ số điện / nước</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Admin luôn nhập/sửa được chỉ số ở đây, kể cả khi phòng KHÔNG bật “Cho phép tenant tự nhập
          chỉ số”. Phải có chỉ số của tháng trước khi tạo hóa đơn.
          {config?.allow_tenant_meter_input
            ? " Phòng này đang cho tenant tự nhập, nên số ở đây có thể do tenant khai."
            : " Phòng này đang tắt quyền tự nhập của tenant."}
        </p>
        <div className="mt-4">
          <MeterReadingSection
            roomId={roomId}
            billingDay={config?.billing_day ?? 1}
            hasDualMeter={config?.has_dual_meter ?? false}
            waterCalcType={(config?.water_calc_type ?? "per_person") as WaterCalcType}
            meterReadings={meterReadings ?? []}
            waterReadings={waterReadings ?? []}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Hóa đơn</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Cần có đủ chỉ số điện (và nước nếu tính theo khối) của tháng trước khi tạo. Phụ phí phát sinh nếu được duyệt sau khi hóa đơn đã thanh toán sẽ tự động chuyển sang hóa đơn tháng tiếp theo.
        </p>
        <div className="mt-4">
          <GenerateInvoiceSection
            roomId={roomId}
            billingDay={config?.billing_day ?? 1}
            invoices={invoices ?? []}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Tài khoản đã đăng ký</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Các tài khoản tenant đang gắn với phòng này (đăng ký qua link mời). Một phòng có thể có
          nhiều tài khoản.
        </p>

        {!accounts || accounts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Chưa có tài khoản nào — tạo link đăng ký ở mục bên dưới.
          </p>
        ) : (
          <>
            {/* mobile: cards */}
            <ul className="mt-4 space-y-3 md:hidden">
              {accounts.map((acc) => (
                <li key={acc.id} className="rounded-xl border border-neutral-200 p-4">
                  <p className="font-medium text-neutral-900">{acc.full_name ?? "Chưa đặt tên"}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
                    <dt>Email</dt>
                    <dd className="break-all text-right">{emailById.get(acc.id) ?? "—"}</dd>
                    <dt>Điện thoại</dt>
                    <dd className="text-right">{acc.phone ?? "—"}</dd>
                    <dt>Đăng ký lúc</dt>
                    <dd className="text-right">{formatDateTimeLabel(acc.created_at)}</dd>
                  </dl>
                </li>
              ))}
            </ul>

            {/* md+: table */}
            <table className="mt-4 hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="py-2 font-medium">Họ tên</th>
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Điện thoại</th>
                  <th className="py-2 font-medium">Đăng ký lúc</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 font-medium text-neutral-900">{acc.full_name ?? "Chưa đặt tên"}</td>
                    <td className="py-3 text-neutral-600">{emailById.get(acc.id) ?? "—"}</td>
                    <td className="py-3 text-neutral-600">{acc.phone ?? "—"}</td>
                    <td className="py-3 text-neutral-600">{formatDateTimeLabel(acc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Link đăng ký tài khoản cho tenant</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tạo link để tenant tự đăng ký email/mật khẩu — mỗi link dùng được 1 lần và hết hạn sau 7 ngày.
        </p>
        <div className="mt-4">
          <InviteManager roomId={roomId} initialInvites={invites ?? []} />
        </div>
      </section>
    </div>
  );
}

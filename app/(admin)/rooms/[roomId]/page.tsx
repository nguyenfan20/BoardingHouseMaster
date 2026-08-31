import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteManager } from "./invite-manager";
import { GenerateInvoiceSection } from "./generate-invoice-section";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room) notFound();

  const { data: invites } = await supabase
    .from("room_invites")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{room.name}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {room.num_occupants} người · {room.base_price.toLocaleString("vi-VN")} đ/tháng
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Tạo hóa đơn</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Cần có đủ chỉ số điện (và nước nếu tính theo khối) của tháng trước khi tạo. Tạo lại sẽ ghi đè hóa đơn
          chưa thanh toán.
        </p>
        <div className="mt-4">
          <GenerateInvoiceSection roomId={roomId} />
        </div>
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

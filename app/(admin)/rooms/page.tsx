import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoRoomsIllustration } from "@/components/illustrations";
import { AddRoomSection } from "./add-room-section";

export const dynamic = "force-dynamic";

const ROOM_TYPE_LABEL_VI: Record<string, string> = {
  normal: "Phòng thường",
  dual_meter: "Phòng 2 đồng hồ",
  mat_bang: "Mặt bằng",
};

export default async function AdminRoomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms").select("*").order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Phòng trọ</h1>
      </div>

      <AddRoomSection />

      {!rooms || rooms.length === 0 ? (
        <EmptyState
          illustration={<NoRoomsIllustration />}
          title="Chưa có phòng nào"
          description="Thêm phòng đầu tiên để bắt đầu quản lý tiền thuê, chỉ số điện nước và hóa đơn."
        />
      ) : (
        <>
          {/* mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-brand-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{room.name}</span>
                    <span className="text-sm text-neutral-600">{room.base_price.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-sm text-neutral-600">
                    <dt>Loại phòng</dt>
                    <dd className="text-right">{ROOM_TYPE_LABEL_VI[room.room_type]}</dd>
                    <dt>Số người</dt>
                    <dd className="text-right">{room.num_occupants}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* md+: table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 font-medium">Phòng</th>
                <th className="py-2 font-medium">Loại phòng</th>
                <th className="py-2 font-medium">Số người</th>
                <th className="py-2 font-medium text-right">Giá thuê</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="py-3">
                    <Link href={`/rooms/${room.id}`} className="font-medium text-neutral-900 hover:text-brand-700">
                      {room.name}
                    </Link>
                  </td>
                  <td className="py-3 text-neutral-600">{ROOM_TYPE_LABEL_VI[room.room_type]}</td>
                  <td className="py-3 text-neutral-600">{room.num_occupants}</td>
                  <td className="py-3 text-right text-neutral-900">{room.base_price.toLocaleString("vi-VN")} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

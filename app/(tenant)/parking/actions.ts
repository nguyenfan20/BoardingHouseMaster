"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export interface ParkingRequestResult {
  success: boolean;
  error?: string;
}

/** Tenant đăng ký gửi xe: biển số + thời điểm để admin sắp xếp chỗ. */
export async function createParkingRequest(
  plateNumber: string,
  scheduledAt: string,
  note?: string
): Promise<ParkingRequestResult> {
  const { user, profile } = await requireRole("tenant");
  if (!profile.room_id) return { success: false, error: "Tài khoản chưa được gán phòng." };

  const plate = plateNumber.trim().toUpperCase();
  if (plate.length < 4) return { success: false, error: "Vui lòng nhập biển số xe hợp lệ." };

  const when = new Date(scheduledAt);
  if (isNaN(when.getTime())) return { success: false, error: "Vui lòng chọn ngày giờ gửi xe." };
  // Cho phép lệch 5 phút để không chặn oan khi người dùng chọn "ngay bây giờ".
  if (when.getTime() < Date.now() - 5 * 60 * 1000) {
    return { success: false, error: "Ngày giờ gửi xe phải ở tương lai." };
  }

  const supabase = await createClient();
  const { data: request, error } = await supabase
    .from("parking_requests")
    .insert({
      room_id: profile.room_id,
      created_by: user.id,
      plate_number: plate,
      scheduled_at: when.toISOString(),
      note: note?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !request) return { success: false, error: "Không thể gửi đăng ký. Vui lòng thử lại." };

  // Thông báo cho admin để sắp xếp chỗ (non-blocking — docs/NOTIFICATIONS.md).
  try {
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
    const { data: room } = await supabase.from("rooms").select("name").eq("id", profile.room_id).single();
    for (const admin of admins ?? []) {
      await createNotification({
        userId: admin.id,
        type: "general",
        title: `Đăng ký gửi xe — ${room?.name ?? "phòng"} (${plate})`,
        body: `${profile.full_name || "Khách thuê"} gửi xe lúc ${when.toLocaleString("vi-VN")}`,
        relatedTable: "parking_requests",
        relatedId: request.id,
      });
    }
  } catch {
    // Non-blocking
  }

  revalidatePath("/parking");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Tenant tự hủy đăng ký của mình (RLS chỉ cho xóa dòng do chính mình tạo). */
export async function cancelParkingRequest(id: string): Promise<ParkingRequestResult> {
  await requireRole("tenant");

  const supabase = await createClient();
  const { error } = await supabase.from("parking_requests").delete().eq("id", id);
  if (error) return { success: false, error: "Không thể hủy đăng ký. Vui lòng thử lại." };

  revalidatePath("/parking");
  revalidatePath("/dashboard");
  return { success: true };
}

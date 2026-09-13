"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export interface DeclareExtraFeeResult {
  success: boolean;
  error?: string;
}

export async function declareExtraFee(
  month: string,
  feeName: string,
  note?: string
): Promise<DeclareExtraFeeResult> {
  const { user, profile } = await requireRole("tenant");
  if (!profile.room_id) return { success: false, error: "Tài khoản chưa được gán phòng." };
  if (!feeName.trim()) return { success: false, error: "Vui lòng nhập tên phụ phí." };

  const supabase = await createClient();
  const { data: fee, error } = await supabase
    .from("extra_fees")
    .insert({
      room_id: profile.room_id,
      month,
      fee_name: feeName.trim(),
      amount: null,
      note: note?.trim() || null,
      status: "declared",
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !fee) return { success: false, error: "Không thể gửi phụ phí. Vui lòng thử lại." };

  // Thông báo cho admin khi có phụ phí mới
  try {
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
    const { data: room } = await supabase.from("rooms").select("name").eq("id", profile.room_id).single();
    const roomName = room?.name ?? "Một phòng";
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: "general",
          title: `Phụ phí mới từ ${roomName}`,
          body: `${profile.full_name || "Khách thuê"} vừa khai báo phụ phí "${feeName.trim()}"`,
          relatedTable: "extra_fees",
          relatedId: fee.id,
        });
      }
    }
  } catch {
    // Non-blocking notification
  }

  revalidatePath("/extra-fees");
  revalidatePath("/extra-fees-review");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface DeclareExtraFeeResult {
  success: boolean;
  error?: string;
}

export async function declareExtraFee(month: string, feeName: string, amount: number, note?: string): Promise<DeclareExtraFeeResult> {
  const { user, profile } = await requireRole("tenant");
  if (!profile.room_id) return { success: false, error: "Tài khoản chưa được gán phòng." };
  if (!feeName.trim() || amount <= 0) return { success: false, error: "Vui lòng nhập tên phụ phí và số tiền hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.from("extra_fees").insert({
    room_id: profile.room_id,
    month,
    fee_name: feeName,
    amount,
    note: note || null,
    status: "pending",
    created_by: user.id,
  });
  if (error) return { success: false, error: "Không thể gửi phụ phí. Vui lòng thử lại." };

  revalidatePath("/extra-fees");
  return { success: true };
}

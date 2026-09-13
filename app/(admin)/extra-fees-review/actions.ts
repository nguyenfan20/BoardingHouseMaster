"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function reviewExtraFee(
  feeId: string,
  decision: "approved" | "rejected",
  amount?: number
) {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const updateData: {
    status: "approved" | "rejected";
    reviewed_by: string;
    reviewed_at: string;
    amount?: number;
  } = {
    status: decision,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  if (decision === "approved" && amount != null && !isNaN(amount) && amount >= 0) {
    updateData.amount = amount;
  }

  const { data: fee, error } = await supabase
    .from("extra_fees")
    .update(updateData)
    .eq("id", feeId)
    .in("status", ["pending", "declared"])
    .select()
    .single();
  if (error || !fee) throw error ?? new Error("Không thể cập nhật phụ phí.");

  if (fee.created_by) {
    await createNotification({
      userId: fee.created_by,
      type: decision === "approved" ? "extra_fee_approved" : "extra_fee_rejected",
      title: decision === "approved" ? `Phụ phí "${fee.fee_name}" đã được duyệt` : `Phụ phí "${fee.fee_name}" bị từ chối`,
      relatedTable: "extra_fees",
      relatedId: fee.id,
    });
  }

  revalidatePath("/extra-fees-review");
}

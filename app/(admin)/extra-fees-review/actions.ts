"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function reviewExtraFee(feeId: string, decision: "approved" | "rejected") {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const { data: fee, error } = await supabase
    .from("extra_fees")
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", feeId)
    .eq("status", "pending")
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

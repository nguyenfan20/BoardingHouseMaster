"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { formatMonthLabel } from "@/lib/utils";

/**
 * Gửi (nhắc) hóa đơn cho các tenant trong phòng CHƯA xem: tạo thêm thông báo `invoice_created`.
 * "Đã xem" = tenant có thông báo của hóa đơn này với is_read = true (mở hóa đơn cũng đánh dấu đọc).
 */
export async function sendInvoiceToUnseenTenants(invoiceId: string): Promise<{ success: boolean; sent: number; error?: string }> {
  await requireAdmin();
  // Service role vì RLS chỉ cho mỗi user đọc thông báo của chính mình.
  const supabase = createServiceRoleClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, room_id, month, total_amount, status")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return { success: false, sent: 0, error: "Không tìm thấy hóa đơn." };

  const [{ data: tenants }, { data: seen }] = await Promise.all([
    supabase.from("users").select("id").eq("room_id", invoice.room_id).eq("role", "tenant"),
    supabase
      .from("notifications")
      .select("user_id")
      .eq("related_table", "invoices")
      .eq("related_id", invoiceId)
      .eq("is_read", true),
  ]);
  const seenIds = new Set((seen ?? []).map((n) => n.user_id));
  const unseen = (tenants ?? []).filter((t) => !seenIds.has(t.id));

  for (const t of unseen) {
    await createNotification({
      userId: t.id,
      type: "invoice_created",
      title: `Hóa đơn tháng ${formatMonthLabel(invoice.month)} đã sẵn sàng`,
      body: `Tổng tiền ${invoice.total_amount.toLocaleString("vi-VN")} đ.`,
      relatedTable: "invoices",
      relatedId: invoice.id,
    });
  }

  revalidatePath("/room-invoices");
  return { success: true, sent: unseen.length };
}

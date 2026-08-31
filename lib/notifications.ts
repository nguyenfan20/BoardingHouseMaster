// Helper tạo notification — dùng trong Server Actions sau các sự kiện ở docs/NOTIFICATIONS.md.
import { createServiceRoleClient } from "@/lib/supabase/server";

export type NotificationType =
  | "extra_fee_approved"
  | "extra_fee_rejected"
  | "invoice_created"
  | "invoice_paid"
  | "general";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  relatedTable?: string;
  relatedId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    related_table: input.relatedTable ?? null,
    related_id: input.relatedId ?? null,
  });
  if (error) throw error;
}

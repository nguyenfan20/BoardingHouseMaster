"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** RLS chỉ cho user update thông báo của chính mình (docs/RLS.md § notifications). */
export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const result = await getCurrentProfile();
  if (!result) return;

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", result.user.id).eq("is_read", false);
  revalidatePath("/notifications");
}

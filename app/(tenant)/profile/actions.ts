"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionResult {
  success: boolean;
  error?: string;
}

/** Tenant tự sửa họ tên/SĐT — chỉ 2 field này, không đụng role/room_id (docs/RLS.md § users). */
export async function updateMyProfile(fullName: string, phone: string): Promise<ProfileActionResult> {
  const { user } = await requireRole("tenant");

  const name = fullName.trim();
  if (!name) return { success: false, error: "Vui lòng nhập họ tên." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ full_name: name, phone: phone.trim() || null })
    .eq("id", user.id);

  if (error) return { success: false, error: "Không thể lưu thông tin. Vui lòng thử lại." };

  revalidatePath("/profile");
  return { success: true };
}

/** Đổi mật khẩu — xác thực lại bằng mật khẩu hiện tại trước khi cho đổi (updateUser không tự hỏi). */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<ProfileActionResult> {
  const { user } = await requireRole("tenant");

  if (newPassword.length < 6) return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };

  const supabase = await createClient();
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (reauthError) return { success: false, error: "Mật khẩu hiện tại không đúng." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: "Không thể đổi mật khẩu. Vui lòng thử lại." };

  return { success: true };
}

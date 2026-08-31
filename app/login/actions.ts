"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_PATH_BY_ROLE } from "@/lib/auth";

export interface SignInResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

// Trả redirectTo cho client tự router.push() thay vì gọi redirect() ở đây — action này được
// gọi trực tiếp từ client (không qua <form action>), và redirect() trong trường hợp đó khiến
// promise phía client resolve về undefined thay vì điều hướng sạch, gây crash khi đọc
// result.success (đã gặp lỗi thật lúc test đăng nhập tenant).
export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { success: false, error: "Email hoặc mật khẩu không đúng." };
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, error: "Tài khoản chưa được thiết lập đầy đủ. Vui lòng liên hệ quản lý." };
  }

  return { success: true, redirectTo: HOME_PATH_BY_ROLE[profile.role] };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

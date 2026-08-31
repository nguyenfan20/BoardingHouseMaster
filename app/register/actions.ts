"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getInviteStatus } from "@/lib/invites";

export interface InviteCheckResult {
  valid: boolean;
  roomName?: string;
  reason?: "not_found" | "used" | "revoked" | "expired";
}

export async function getInviteByToken(token: string): Promise<InviteCheckResult> {
  const supabase = createServiceRoleClient();
  const { data: invite } = await supabase.from("room_invites").select("*").eq("token", token).single();

  if (!invite) return { valid: false, reason: "not_found" };

  const status = getInviteStatus(invite);
  if (status !== "active") return { valid: false, reason: status as "used" | "revoked" | "expired" };

  const { data: room } = await supabase.from("rooms").select("name").eq("id", invite.room_id).single();
  return { valid: true, roomName: room?.name };
}

export interface RegisterInput {
  token: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerWithInvite(input: RegisterInput): Promise<RegisterResult> {
  const supabase = createServiceRoleClient();

  // 1. Re-check token ngay trước khi tạo tài khoản — chống race condition dùng link 2 lần.
  const { data: invite } = await supabase.from("room_invites").select("*").eq("token", input.token).single();
  if (!invite || getInviteStatus(invite) !== "active") {
    return { success: false, error: "Link đăng ký không còn hiệu lực. Vui lòng liên hệ quản lý để xin link mới." };
  }

  if (input.password.length < 6) {
    return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  // 2. Tạo tài khoản Supabase Auth.
  const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (createUserError || !created.user) {
    return { success: false, error: createUserError?.message ?? "Không thể tạo tài khoản." };
  }

  // 3. Tạo profile trong `users` (role='tenant', gán room_id từ invite).
  const { error: profileError } = await supabase.from("users").insert({
    id: created.user.id,
    role: "tenant",
    room_id: invite.room_id,
    full_name: input.fullName,
    phone: input.phone ?? null,
  });

  if (profileError) {
    // Không để lại tài khoản auth mồ côi nếu bước tạo profile thất bại.
    await supabase.auth.admin.deleteUser(created.user.id);
    return { success: false, error: "Không thể hoàn tất đăng ký. Vui lòng thử lại." };
  }

  // 4. Đánh dấu link đã dùng — chỉ khi vẫn còn active tại thời điểm update (chặn race condition).
  const { data: markUsedRows, error: markUsedError } = await supabase
    .from("room_invites")
    .update({ used_at: new Date().toISOString(), used_by: created.user.id })
    .eq("id", invite.id)
    .is("used_at", null)
    .select("id");

  if (markUsedError || !markUsedRows || markUsedRows.length === 0) {
    // Hai request đăng ký cùng lúc dùng chung 1 token — request thua cuộc rollback tài khoản vừa tạo.
    await supabase.from("users").delete().eq("id", created.user.id);
    await supabase.auth.admin.deleteUser(created.user.id);
    return { success: false, error: "Link đăng ký vừa được sử dụng ở nơi khác. Vui lòng xin link mới." };
  }

  return { success: true };
}

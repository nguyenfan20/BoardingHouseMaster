// Kiểm tra role — lớp phòng thủ thứ hai cùng với RLS (docs/RLS.md § Lưu ý triển khai).
// Dùng `requireRole`/`requireAdmin` (throw) trong Server Actions; dùng `requireRolePage`
// (redirect) trong layout của route group để chặn UI trước khi render.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export const HOME_PATH_BY_ROLE: Record<UserRole, string> = {
  admin: "/dashboard",
  tenant: "/invoices",
};

export class UnauthorizedError extends Error {
  constructor(message = "Không có quyền thực hiện thao tác này.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("role, room_id, full_name").eq("id", user.id).single();
  if (!profile) return null;

  return {
    user,
    profile: {
      ...profile,
      role: profile.role as UserRole,
    },
  };
}

export async function requireRole(role: UserRole) {
  const result = await getCurrentProfile();
  if (!result) throw new UnauthorizedError("Chưa đăng nhập.");
  if (result.profile.role !== role) throw new UnauthorizedError();
  return result;
}

export async function requireAdmin() {
  return requireRole("admin");
}

/** Dùng trong layout Server Component — chặn UI bằng redirect thay vì throw. */
export async function requireRolePage(role: UserRole) {
  const result = await getCurrentProfile();
  if (!result) redirect("/login");
  if (result.profile.role !== role) redirect(HOME_PATH_BY_ROLE[result.profile.role]);
  return result;
}

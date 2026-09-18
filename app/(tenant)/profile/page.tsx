import { getCurrentProfile } from "@/lib/auth";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function TenantProfilePage() {
  const result = await getCurrentProfile();
  const fullName = result?.profile.full_name ?? "";
  const phone = result?.profile.phone ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Hồ sơ của tôi</h1>
        <p className="mt-1 text-sm text-neutral-600">Cập nhật thông tin cá nhân và mật khẩu đăng nhập.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Thông tin cá nhân</h2>
        <ProfileForm fullName={fullName} phone={phone} />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Đổi mật khẩu</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

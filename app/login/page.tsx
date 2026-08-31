import { redirect } from "next/navigation";
import { getCurrentProfile, HOME_PATH_BY_ROLE } from "@/lib/auth";
import { AuthIllustration } from "@/components/illustrations";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  const result = await getCurrentProfile();
  if (result) redirect(HOME_PATH_BY_ROLE[result.profile.role]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mx-auto mb-6 w-full max-w-[200px]">
        <AuthIllustration />
      </div>
      <h1 className="text-center text-xl font-semibold text-neutral-900">BoardingHouseMaster</h1>
      <p className="mt-1 text-center text-sm text-neutral-600">Đăng nhập để quản lý nhà trọ</p>

      {registered && (
        <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-center text-sm text-brand-700">
          Đăng ký thành công. Vui lòng đăng nhập.
        </p>
      )}

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <LoginForm />
      </div>
    </div>
  );
}

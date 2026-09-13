import { getInviteByToken } from "./actions";
import { RegisterForm } from "./register-form";
import { AuthIllustration } from "@/components/illustrations";
import { LiveDateTime } from "@/components/live-date-time";

export const dynamic = "force-dynamic";

const REASON_MESSAGE: Record<string, string> = {
  not_found: "Link đăng ký không tồn tại. Vui lòng kiểm tra lại đường link.",
  used: "Link đăng ký này đã được sử dụng.",
  revoked: "Link đăng ký này đã bị thu hồi.",
  expired: "Link đăng ký này đã hết hạn (link chỉ có hiệu lực 7 ngày).",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InvalidInvite message="Thiếu thông tin link đăng ký. Vui lòng dùng đúng đường link được quản lý gửi." />
    );
  }

  const result = await getInviteByToken(token);

  if (!result.valid) {
    return <InvalidInvite message={REASON_MESSAGE[result.reason ?? "not_found"]} />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-3 flex justify-center">
        <LiveDateTime variant="card" />
      </div>
      <div className="mx-auto mb-6 w-full max-w-[200px]">
        <AuthIllustration />
      </div>
      <h1 className="text-center text-xl font-semibold text-neutral-900">Đăng ký tài khoản</h1>
      <p className="mt-1 text-center text-sm text-neutral-600">
        Tài khoản sẽ được gán cho <span className="font-medium text-neutral-900">{result.roomName}</span>
      </p>
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <RegisterForm token={token} />
      </div>
    </div>
  );
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">Không thể đăng ký</h1>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
    </div>
  );
}

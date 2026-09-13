import { redirect } from "next/navigation";
import { getCurrentProfile, HOME_PATH_BY_ROLE } from "@/lib/auth";
import { AuthIllustration } from "@/components/illustrations";
import { LiveDateTime } from "@/components/live-date-time";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Đăng nhập — 86A Nguyễn Duy",
  description: "Đăng nhập để quản lý và xem thông tin nhà trọ.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  const result = await getCurrentProfile();
  if (result) redirect(HOME_PATH_BY_ROLE[result.profile.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="mb-3 flex justify-center">
          <LiveDateTime variant="card" />
        </div>

        {/* ── Clay hero card ─────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl bg-brand-50 px-8 pb-8 pt-10"
          style={{
            boxShadow:
              "0 8px 32px rgba(84,107,65,.10), 0 1px 4px rgba(84,107,65,.06)",
          }}
        >
          {/* Blob 1 — large top-left */}
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 bg-brand-100 opacity-70"
            style={{
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              boxShadow:
                "6px 6px 12px rgba(84,107,65,.12), inset 2px 2px 6px rgba(255,255,255,.65)",
            }}
          />
          {/* Blob 2 — small bottom-right */}
          <div
            className="pointer-events-none absolute -bottom-8 -right-6 h-32 w-32 bg-brand-200 opacity-50"
            style={{
              borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
              boxShadow:
                "4px 4px 10px rgba(84,107,65,.10), inset 1px 1px 4px rgba(255,255,255,.6)",
            }}
          />

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-5 w-full max-w-[160px]">
              <AuthIllustration />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
              Quản lý
            </p>
            <h1 className="text-2xl font-bold text-neutral-900">
              86A Nguyễn Duy
            </h1>
          </div>
        </div>

        {/* ── Success banner ─────────────────────────────────── */}
        {registered && (
          <p className="mt-4 rounded-xl bg-brand-50 px-4 py-2.5 text-center text-sm text-brand-700 ring-1 ring-brand-200">
            Đăng ký thành công. Vui lòng đăng nhập.
          </p>
        )}

        {/* ── Form card ──────────────────────────────────────── */}
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-6 py-7 shadow-sm">
          <LoginForm />
        </div>

      </div>
    </div>
  );
}

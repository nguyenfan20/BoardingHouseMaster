// Shell: .claude/skills/ui-design/references/components.md § Admin shell skeleton
import { requireRolePage } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminMobileMenu } from "@/components/admin-mobile-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";
import { LiveDateTime } from "@/components/live-date-time";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRolePage("admin");

  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6 px-3 text-base font-semibold text-neutral-900">86A Nguyễn Duy</div>
        <AdminNav />
        <div className="mt-auto space-y-1 border-t border-neutral-200 pt-4">
          <p className="truncate px-3 text-sm text-neutral-600">{profile.full_name ?? "Admin"}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <AdminMobileMenu userName={profile.full_name ?? undefined} />
            <span className="font-semibold text-neutral-900 md:hidden">86A Nguyễn Duy</span>
          </div>
          <div className="flex items-center gap-3">
            <LiveDateTime />
            <NotificationBell />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

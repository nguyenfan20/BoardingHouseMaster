// Shell: .claude/skills/ui-design/references/components.md § Tenant shell skeleton
import { requireRolePage } from "@/lib/auth";
import { NotificationBell } from "@/components/notification-bell";
import { TenantNav, TenantTopTabs } from "@/components/tenant-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { LiveDateTime } from "@/components/live-date-time";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage("tenant");

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-8 print:bg-white print:pb-0">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-900">86A Nguyễn Duy</span>
          </div>
          <div className="flex items-center gap-2">
            <LiveDateTime />
            <NotificationBell />
            <SignOutButton variant="inline" />
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <TenantTopTabs />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">{children}</main>

      <TenantNav />
    </div>
  );
}

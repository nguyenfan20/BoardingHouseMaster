// Shell: .claude/skills/ui-design/references/components.md § Tenant shell skeleton
import { requireRolePage } from "@/lib/auth";
import { NotificationBell } from "@/components/notification-bell";
import { TenantNav, TenantTopTabs } from "@/components/tenant-nav";
import { SignOutButton } from "@/components/sign-out-button";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage("tenant");

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 md:pb-0">
      <header className="sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 md:px-6">
          <span className="font-semibold text-neutral-900">BoardingHouseMaster</span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <SignOutButton variant="inline" />
          </div>
        </div>
        <div className="px-4 md:px-6">
          <TenantTopTabs />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">{children}</main>

      <TenantNav />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/rooms", label: "Phòng trọ" },
  { href: "/billing-config", label: "Cấu hình tính tiền" },
  { href: "/bank-info", label: "Ngân hàng" },
  { href: "/extra-fees-review", label: "Duyệt phụ phí" },
  { href: "/parking-requests", label: "Lịch sử đăng ký xe" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

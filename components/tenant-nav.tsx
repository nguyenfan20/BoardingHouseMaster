"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/invoices", label: "Hóa đơn" },
  { href: "/meter-input", label: "Nhập chỉ số" },
  { href: "/extra-fees", label: "Phụ phí" },
];

export function TenantNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white print:hidden md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium",
              active ? "text-brand-700" : "text-neutral-600"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TenantTopTabs() {
  const pathname = usePathname();

  return (
    <nav className="hidden gap-1 border-b border-neutral-200 print:hidden md:flex">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-4 py-3 text-sm font-medium",
              active ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-600 hover:text-neutral-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

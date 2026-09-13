"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Drawer nav cho admin dưới `md`. Phải chứa MỌI thứ trong sidebar desktop (nav + tên user +
 * đăng xuất) — sidebar bị `hidden` ở mobile nên thứ gì chỉ nằm trong sidebar là mất hẳn trên
 * điện thoại (cùng lỗi đã sửa cho tenant, xem CONTEXT.md 2026-08-31).
 */
export function AdminMobileMenu({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Mở menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20 bg-neutral-900/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white p-4 shadow-sm">
            <div className="mb-6 px-3 text-base font-semibold text-neutral-900">86A Nguyễn Duy</div>
            <AdminNav onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-1 border-t border-neutral-200 pt-4">
              <p className="truncate px-3 text-sm text-neutral-600">{userName ?? "Admin"}</p>
              <SignOutButton />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

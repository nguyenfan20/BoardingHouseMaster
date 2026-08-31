"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";

export function AdminMobileMenu() {
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
          <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white p-4 shadow-sm">
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

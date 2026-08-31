"use client";

import { useTransition } from "react";
import { signOut } from "@/app/login/actions";

export function SignOutButton({ variant = "block" }: { variant?: "block" | "inline" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
      className={
        variant === "block"
          ? "w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
          : "rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
      }
    >
      Đăng xuất
    </button>
  );
}

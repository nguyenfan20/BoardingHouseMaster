"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInWithPassword } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsPending(true);
    try {
      const result = await signInWithPassword(email, password);
      if (!result.success) {
        setFormError(result.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      router.push(result.redirectTo ?? "/");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="email" name="email" label="Email" type="email" autoComplete="email" required />
      <Input id="password" name="password" label="Mật khẩu" type="password" autoComplete="current-password" required />

      {formError && <p className="text-sm text-error-600">{formError}</p>}

      <Button type="submit" isLoading={isPending} className="w-full">
        Đăng nhập
      </Button>
    </form>
  );
}

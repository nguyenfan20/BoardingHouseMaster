"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerWithInvite } from "./actions";

export function RegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");
    const phone = String(formData.get("phone") ?? "");

    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập họ tên.";
    if (!email.trim()) errors.email = "Vui lòng nhập email.";
    if (password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsPending(true);
    try {
      const result = await registerWithInvite({ token, email, password, fullName, phone });
      if (!result.success) {
        setFormError(result.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }
      router.push("/login?registered=1");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="fullName" name="fullName" label="Họ và tên" error={fieldErrors.fullName} autoComplete="name" />
      <Input
        id="phone"
        name="phone"
        label="Số điện thoại (không bắt buộc)"
        type="tel"
        autoComplete="tel"
      />
      <Input id="email" name="email" label="Email" type="email" error={fieldErrors.email} autoComplete="email" />
      <Input
        id="password"
        name="password"
        label="Mật khẩu"
        type="password"
        error={fieldErrors.password}
        autoComplete="new-password"
      />

      {formError && <p className="text-sm text-error-600">{formError}</p>}

      <Button type="submit" isLoading={isPending} className="w-full">
        Đăng ký
      </Button>
    </form>
  );
}

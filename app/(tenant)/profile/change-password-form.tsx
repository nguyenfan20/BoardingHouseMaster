"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changeMyPassword } from "./actions";

export function ChangePasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const newPassword = String(fd.get("newPassword") ?? "");
    if (newPassword !== String(fd.get("confirmPassword") ?? "")) {
      setError("Mật khẩu mới nhập lại không khớp.");
      return;
    }

    setIsPending(true);
    try {
      const result = await changeMyPassword(String(fd.get("currentPassword") ?? ""), newPassword);
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      form.reset();
      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="currentPassword" name="currentPassword" label="Mật khẩu hiện tại" type="password" required />
      <Input id="newPassword" name="newPassword" label="Mật khẩu mới" type="password" minLength={6} required />
      <Input id="confirmPassword" name="confirmPassword" label="Nhập lại mật khẩu mới" type="password" minLength={6} required />

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã đổi mật khẩu.</p>}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Đổi mật khẩu
      </Button>
    </form>
  );
}

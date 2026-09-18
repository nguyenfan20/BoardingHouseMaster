"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateMyProfile } from "./actions";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      const result = await updateMyProfile(String(fd.get("fullName") ?? ""), String(fd.get("phone") ?? ""));
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="fullName" name="fullName" label="Họ tên" defaultValue={fullName} required />
      <Input id="phone" name="phone" label="Số điện thoại" type="tel" defaultValue={phone} />

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã lưu thông tin.</p>}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Lưu thông tin
      </Button>
    </form>
  );
}

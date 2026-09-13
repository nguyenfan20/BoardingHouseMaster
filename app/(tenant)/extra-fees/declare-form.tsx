"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { declareExtraFee } from "./actions";

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function DeclareExtraFeeForm() {
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
      const result = await declareExtraFee(
        currentMonthIso(),
        String(fd.get("feeName") ?? ""),
        String(fd.get("note") ?? "")
      );
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="feeName" name="feeName" label="Tên phụ phí" placeholder="VD: Có thêm bạn ghé chơi" required />
      <Input id="note" name="note" label="Ghi chú (không bắt buộc)" placeholder="Mô tả thêm nếu cần" />

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã thông báo phụ phí. Quản lý sẽ thêm số tiền khi lập hóa đơn.</p>}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Thông báo
      </Button>
    </form>
  );
}

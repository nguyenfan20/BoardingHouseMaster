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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      const result = await declareExtraFee(
        currentMonthIso(),
        String(fd.get("feeName") ?? ""),
        Number(fd.get("amount")),
        String(fd.get("note") ?? "")
      );
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      (e.target as HTMLFormElement).reset();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="feeName" name="feeName" label="Tên phụ phí" placeholder="VD: Wifi tháng này" required />
      <Input id="amount" name="amount" label="Số tiền (đ)" type="number" min={1} required />
      <Input id="note" name="note" label="Ghi chú (không bắt buộc)" />

      {error && <p className="text-sm text-error-600">{error}</p>}

      <Button type="submit" isLoading={isPending}>
        Gửi
      </Button>
    </form>
  );
}

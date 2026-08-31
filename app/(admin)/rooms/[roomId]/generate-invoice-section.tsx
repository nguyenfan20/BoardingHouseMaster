"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateInvoiceForRoom } from "./actions";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function GenerateInvoiceSection({ roomId }: { roomId: string }) {
  const [monthInput, setMonthInput] = useState(currentMonthValue());
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  async function handleGenerate() {
    setError(null);
    setTotalAmount(null);
    setIsPending(true);
    try {
      const month = `${monthInput}-01`;
      const result = await generateInvoiceForRoom(roomId, month);
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      setTotalAmount(result.totalAmount ?? null);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        id="invoiceMonth"
        label="Tháng"
        type="month"
        value={monthInput}
        onChange={(e) => setMonthInput(e.target.value)}
        className="sm:w-48"
      />
      <Button type="button" onClick={handleGenerate} isLoading={isPending}>
        Tạo / cập nhật hóa đơn
      </Button>
      {error && <p className="text-sm text-error-600">{error}</p>}
      {totalAmount !== null && (
        <p className="text-sm text-brand-700">Đã tạo hóa đơn: {totalAmount.toLocaleString("vi-VN")} đ</p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import { reviewExtraFee } from "./actions";

type ExtraFee = Database["public"]["Tables"]["extra_fees"]["Row"];

export function ReviewList({ fees, roomNameById }: { fees: ExtraFee[]; roomNameById: Record<string, string> }) {
  const [items, setItems] = useState(fees);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  function handleDecision(feeId: string, decision: "approved" | "rejected") {
    setProcessingId(feeId);
    startTransition(async () => {
      await reviewExtraFee(feeId, decision);
      setItems((prev) => prev.filter((f) => f.id !== feeId));
      setProcessingId(null);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-600">Đã xử lý hết — làm mới trang để xem phụ phí mới.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((fee) => (
        <li key={fee.id} className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-neutral-900">{fee.fee_name}</p>
              <p className="text-sm text-neutral-600">
                {roomNameById[fee.room_id] ?? "—"} · tháng {formatMonthLabel(fee.month)}
              </p>
              {fee.note && <p className="mt-1 text-sm text-neutral-600">{fee.note}</p>}
            </div>
            <span className="font-semibold text-neutral-900">{fee.amount.toLocaleString("vi-VN")} đ</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              onClick={() => handleDecision(fee.id, "approved")}
              disabled={isPending}
              isLoading={isPending && processingId === fee.id}
            >
              Duyệt
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleDecision(fee.id, "rejected")} disabled={isPending}>
              Từ chối
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

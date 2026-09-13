"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils";
import type { Database } from "@/types/database";
import { reviewExtraFee } from "./actions";

type ExtraFee = Database["public"]["Tables"]["extra_fees"]["Row"];

export function ReviewList({ fees, roomNameById }: { fees: ExtraFee[]; roomNameById: Record<string, string> }) {
  const [items, setItems] = useState(fees);
  const [amounts, setAmounts] = useState<Record<string, number | "">>(() => {
    const init: Record<string, number | ""> = {};
    fees.forEach((f) => {
      init[f.id] = f.amount != null ? f.amount : "";
    });
    return init;
  });
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleDecision(feeId: string, decision: "approved" | "rejected") {
    setErrorMsg(null);
    const amountVal = amounts[feeId];
    const numericAmount = typeof amountVal === "number" && amountVal >= 0 ? amountVal : undefined;

    setProcessingId(feeId);
    startTransition(async () => {
      try {
        await reviewExtraFee(feeId, decision, numericAmount);
        setItems((prev) => prev.filter((f) => f.id !== feeId));
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      } finally {
        setProcessingId(null);
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-600">Đã xử lý hết — làm mới trang để xem phụ phí mới.</p>;
  }

  return (
    <div className="space-y-3">
      {errorMsg && <p className="text-sm text-error-600">{errorMsg}</p>}
      <ul className="space-y-3">
        {items.map((fee) => {
          const isDeclared = fee.status === "declared";
          return (
            <li key={fee.id} className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">{fee.fee_name}</p>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        isDeclared
                          ? "bg-brand-50 text-brand-700 border border-brand-200"
                          : "bg-warning-50 text-warning-700 border border-warning-200"
                      }`}
                    >
                      {isDeclared ? "Tenant khai báo" : "Chờ duyệt"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-800">{roomNameById[fee.room_id] ?? "Phòng"}</span> · tháng{" "}
                    {formatMonthLabel(fee.month)}
                  </p>
                  {fee.note && <p className="text-sm text-neutral-600 italic">Ghi chú: {fee.note}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-36 sm:w-44">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Nhập số tiền..."
                      value={amounts[fee.id] ?? ""}
                      onChange={(e) =>
                        setAmounts((prev) => ({
                          ...prev,
                          [fee.id]: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 pr-7 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      đ
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDecision(fee.id, "rejected")}
                  disabled={isPending}
                  className="text-xs text-error-600 hover:bg-error-50 hover:border-error-200"
                >
                  Từ chối
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDecision(fee.id, "approved")}
                  disabled={isPending}
                  isLoading={isPending && processingId === fee.id}
                  className="text-xs"
                >
                  Duyệt & Lưu số tiền
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

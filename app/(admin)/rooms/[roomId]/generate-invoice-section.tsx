"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMonthLabel } from "@/lib/utils";
import { billingMonthFor } from "@/lib/billing/billing-cycle";
import type { Database } from "@/types/database";
import { generateInvoiceForRoom, markInvoicePaid } from "./actions";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

// `invoices` lấy thẳng từ props (Server Component) chứ không copy vào useState — mỗi Server
// Action ở đây đều revalidatePath nên Next tự refetch RSC và đẩy danh sách mới xuống; nếu copy
// vào state thì hóa đơn vừa tạo không xuất hiện cho tới khi reload trang.
export function GenerateInvoiceSection({
  roomId,
  billingDay,
  invoices,
}: {
  roomId: string;
  billingDay: number;
  invoices: Invoice[];
}) {
  // Mặc định là kỳ đang chốt theo ngày chốt riêng của phòng (billing_config.billing_day):
  // chưa tới ngày chốt thì vẫn là kỳ tháng trước.
  const [monthInput, setMonthInput] = useState(() => billingMonthFor(billingDay).slice(0, 7));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  const [isMarkingPaid, startTransition] = useTransition();
  const [payingId, setPayingId] = useState<string | null>(null);

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

  function handleMarkPaid(invoiceId: string) {
    setPayingId(invoiceId);
    startTransition(async () => {
      try {
        await markInvoicePaid(invoiceId, roomId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Có lỗi khi cập nhật.");
      } finally {
        setPayingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Form tạo hóa đơn */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          id="invoiceMonth"
          label="Tháng lập hóa đơn"
          type="month"
          value={monthInput}
          onChange={(e) => setMonthInput(e.target.value)}
          className="sm:w-48"
        />
        <Button type="button" onClick={handleGenerate} isLoading={isPending}>
          Tạo / cập nhật hóa đơn
        </Button>
      </div>

      <p className="text-xs text-neutral-500">
        Ngày chốt tiền của phòng: <span className="font-medium text-neutral-700">ngày {billingDay} hằng tháng</span>{" "}
        · đổi ở <Link href={`/billing-config/${roomId}`} className="font-medium text-brand-700 hover:text-brand-600">Cấu hình tính tiền</Link>.
      </p>

      {error && <p className="text-sm text-error-600">{error}</p>}
      {totalAmount !== null && (
        <p className="text-sm text-brand-700">Đã lưu hóa đơn: {totalAmount.toLocaleString("vi-VN")} đ</p>
      )}

      {/* Danh sách hóa đơn của phòng */}
      {invoices && invoices.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-neutral-900">Danh sách hóa đơn phòng</h3>
          <ul className="space-y-2">
            {invoices.map((inv) => {
              const isPaid = inv.status === "paid";
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Tháng {formatMonthLabel(inv.month)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Tổng tiền: {inv.total_amount.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge status={isPaid ? "paid" : "unpaid"}>
                      {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </Badge>
                    {!isPaid && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={isMarkingPaid}
                        isLoading={isMarkingPaid && payingId === inv.id}
                        className="text-xs"
                      >
                        Xác nhận đã thanh toán
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

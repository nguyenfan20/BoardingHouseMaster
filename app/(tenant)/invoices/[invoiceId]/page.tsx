import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatMonthLabel } from "@/lib/utils";
import type { InvoiceBreakdown } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export default async function TenantInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) notFound();

  const breakdown = invoice.breakdown as unknown as InvoiceBreakdown;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Hóa đơn tháng {formatMonthLabel(invoice.month)}
        </h1>
        <Badge status={invoice.status}>{invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</Badge>
      </div>

      {invoice.qr_url && invoice.status === "unpaid" && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh QR động từ VietQR, không phù hợp next/image */}
          <img src={invoice.qr_url} alt="Mã QR chuyển khoản" className="h-56 w-56 rounded-lg border border-neutral-200" />
          <p className="text-sm text-neutral-600">Quét mã để chuyển khoản {formatVnd(invoice.total_amount)}</p>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Chi tiết</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Tiền phòng" value={formatVnd(breakdown.basePrice)} />
          <Row label={`Tiền điện (${breakdown.electricity.consumedKwh} kWh)`} value={formatVnd(breakdown.electricity.totalElectric)} />
          <Row label="Tiền nước" value={formatVnd(breakdown.water.water)} />
          {breakdown.extraFees.items.map((item, i) => (
            <Row key={i} label={item.feeName} value={formatVnd(item.amount)} />
          ))}
          <div className="!mt-4 flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
            <span>Tổng cộng</span>
            <span>{formatVnd(invoice.total_amount)}</span>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{label}</span>
      <span className="text-neutral-900">{value}</span>
    </div>
  );
}

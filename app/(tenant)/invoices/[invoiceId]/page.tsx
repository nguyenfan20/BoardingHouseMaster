import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatMonthLabel } from "@/lib/utils";
import { DownloadInvoiceButton } from "./download-invoice-button";
import type { InvoiceBreakdown } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function electricityTaxLabel(breakdown: InvoiceBreakdown) {
  const isSurcharge = breakdown.electricity.meterType === "dual" && breakdown.electricity.surcharge > 0;
  if (isSurcharge) {
    return { label: `Phụ thu 2 đồng hồ (${breakdown.ratesSnapshot.dualMeterSurchargePercent}%)`, amount: (breakdown.electricity as { surcharge: number }).surcharge };
  }
  return { label: `Thuế điện (${breakdown.ratesSnapshot.electricityTaxPercent}%)`, amount: breakdown.electricity.tax };
}

export default async function TenantInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) notFound();

  const { data: room } = await supabase.from("rooms").select("name").eq("id", invoice.room_id).single();

  const breakdown = invoice.breakdown as unknown as InvoiceBreakdown;
  const tax = electricityTaxLabel(breakdown);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-neutral-900">Hóa đơn</h1>
        <DownloadInvoiceButton />
      </div>

      {/* Toàn bộ khối dưới đây là nội dung được in khi bấm "Tải hóa đơn" — xem globals.css @media print. */}
      <div id="invoice-print-area" className="rounded-lg border border-neutral-200 bg-white p-6 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-600">Hóa đơn tiền trọ</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">{room?.name ?? "—"}</h2>
            <p className="mt-0.5 text-sm text-neutral-600">Tháng {formatMonthLabel(invoice.month)}</p>
          </div>
          <Badge status={invoice.status}>{invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</Badge>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto]">
          <dl className="space-y-2 text-sm">
            <Row label="Tiền phòng" value={formatVnd(breakdown.basePrice)} />
            <Row label={`Tiền điện (${breakdown.electricity.consumedKwh} kWh)`} value={formatVnd(breakdown.electricity.electricity)} />
            {tax.amount > 0 && <Row label={tax.label} value={formatVnd(tax.amount)} />}
            <Row label="Tiền nước" value={formatVnd(breakdown.water.water)} />
            {breakdown.extraFees.items.map((item, i) => (
              <Row key={i} label={item.feeName} value={formatVnd(item.amount)} />
            ))}
            <div className="!mt-4 flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
              <span>Tổng cộng</span>
              <span>{formatVnd(invoice.total_amount)}</span>
            </div>
          </dl>

          {invoice.qr_url && invoice.status === "unpaid" && (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-neutral-50 p-4 print:bg-white lg:w-56">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh QR động từ VietQR, không phù hợp next/image */}
              <img src={invoice.qr_url} alt="Mã QR chuyển khoản" className="h-44 w-44 rounded-lg border border-neutral-200 bg-white" />
              <p className="text-center text-xs text-neutral-600">Quét mã để chuyển khoản {formatVnd(invoice.total_amount)}</p>
            </div>
          )}
        </div>
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

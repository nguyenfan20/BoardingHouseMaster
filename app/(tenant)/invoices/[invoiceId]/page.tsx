import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { InvoiceCard } from "@/components/invoice-card";
import { DownloadInvoiceButton } from "./download-invoice-button";

export const dynamic = "force-dynamic";

export default async function TenantInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) notFound();

  const { data: room } = await supabase.from("rooms").select("name").eq("id", invoice.room_id).single();

  // Mở hóa đơn = đã xem: đánh dấu đã đọc các thông báo của hóa đơn này để admin biết tenant đã xem
  // (trang /room-invoices dựa vào notifications.is_read). RLS cho phép tenant tự update thông báo của mình.
  const me = await getCurrentProfile();
  if (me) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", me.user.id)
      .eq("related_table", "invoices")
      .eq("related_id", invoiceId)
      .eq("is_read", false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            title="Quay lại danh sách"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Chi tiết hóa đơn</h1>
        </div>
        <DownloadInvoiceButton fileName={`${room?.name ?? "hoa-don"}-${invoice.month.slice(0, 7)}`} />
      </div>

      <InvoiceCard invoice={invoice} roomName={room?.name} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceCard } from "@/components/invoice-card";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (!invoice) notFound();
  const { data: room } = await supabase.from("rooms").select("name").eq("id", invoice.room_id).single();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/room-invoices" className="text-sm font-medium text-brand-700 hover:text-brand-600">
          ← Danh sách hóa đơn
        </Link>
      </div>
      <InvoiceCard invoice={invoice} roomName={room?.name} />
    </div>
  );
}

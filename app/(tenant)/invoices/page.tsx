import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { NoInvoicesIllustration } from "@/components/illustrations";
import { formatMonthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantInvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase.from("invoices").select("*").order("month", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Hóa đơn</h1>

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          illustration={<NoInvoicesIllustration />}
          title="Chưa có hóa đơn nào"
          description="Hóa đơn hàng tháng sẽ hiện ở đây sau khi quản lý tạo."
        />
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/invoices/${invoice.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm active:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 group-hover:text-brand-700">
                    Tháng {formatMonthLabel(invoice.month)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-600">
                    {invoice.total_amount.toLocaleString("vi-VN")} đ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={invoice.status as "paid" | "unpaid"}>
                    {invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </Badge>
                  <svg className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

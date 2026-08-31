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
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-brand-200"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    Tháng {formatMonthLabel(invoice.month)}
                  </p>
                  <p className="text-sm text-neutral-600">{invoice.total_amount.toLocaleString("vi-VN")} đ</p>
                </div>
                <Badge status={invoice.status}>{invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

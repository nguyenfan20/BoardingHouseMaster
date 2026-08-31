import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DeclareExtraFeeForm } from "./declare-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL_VI: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export default async function TenantExtraFeesPage() {
  const supabase = await createClient();
  const { data: fees } = await supabase.from("extra_fees").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Phụ phí</h1>
        <p className="mt-1 text-sm text-neutral-600">Khai báo phụ phí phát sinh trong tháng, chờ quản lý duyệt.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <DeclareExtraFeeForm />
      </div>

      {fees && fees.length > 0 && (
        <ul className="space-y-2">
          {fees.map((fee) => (
            <li key={fee.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 text-sm">
              <div>
                <p className="font-medium text-neutral-900">{fee.fee_name}</p>
                <p className="text-neutral-600">{fee.amount.toLocaleString("vi-VN")} đ</p>
              </div>
              <Badge status={fee.status}>{STATUS_LABEL_VI[fee.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

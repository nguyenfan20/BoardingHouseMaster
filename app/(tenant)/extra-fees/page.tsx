import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel } from "@/lib/utils";
import { DeclareExtraFeeForm } from "./declare-form";

export const dynamic = "force-dynamic";

export default async function TenantExtraFeesPage() {
  const supabase = await createClient();
  const { data: fees } = await supabase
    .from("extra_fees")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Phụ phí</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Khai báo phụ phí phát sinh để quản lý biết và thêm vào hóa đơn.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <DeclareExtraFeeForm />
      </div>

      {fees && fees.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Đã khai báo</h2>
          <ul className="space-y-2">
            {fees.map((fee) => (
              <li
                key={fee.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-xs"
              >
                <p className="font-semibold text-neutral-900">{fee.fee_name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Tháng {formatMonthLabel(fee.month)}
                  {fee.note ? ` · ${fee.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { BankInfoForm } from "./bank-info-form";

export const dynamic = "force-dynamic";

export default async function AdminBankInfoPage() {
  const supabase = await createClient();
  const { data: bankInfo } = await supabase.from("bank_info").select("*").limit(1).maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Thông tin ngân hàng</h1>
        <p className="mt-1 text-sm text-neutral-600">Dùng để tạo mã QR chuyển khoản trên hóa đơn (VietQR).</p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <BankInfoForm bankInfo={bankInfo} />
      </div>
    </div>
  );
}

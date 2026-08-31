"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";
import { upsertBankInfo } from "./actions";

type BankInfo = Database["public"]["Tables"]["bank_info"]["Row"];

export function BankInfoForm({ bankInfo }: { bankInfo: BankInfo | null }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    setSaved(false);
    try {
      await upsertBankInfo({
        id: bankInfo?.id,
        bankCode: String(fd.get("bankCode") ?? ""),
        accountNo: String(fd.get("accountNo") ?? ""),
        accountName: String(fd.get("accountName") ?? ""),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="bankCode"
        name="bankCode"
        label="Mã ngân hàng (VietQR)"
        placeholder="VD: 970436 (Vietcombank)"
        defaultValue={bankInfo?.bank_code}
        required
      />
      <Input id="accountNo" name="accountNo" label="Số tài khoản" defaultValue={bankInfo?.account_no} required />
      <Input id="accountName" name="accountName" label="Tên chủ tài khoản" defaultValue={bankInfo?.account_name} required />

      {saved && <p className="text-sm text-brand-700">Đã lưu.</p>}

      <Button type="submit" isLoading={isPending}>
        Lưu
      </Button>
    </form>
  );
}

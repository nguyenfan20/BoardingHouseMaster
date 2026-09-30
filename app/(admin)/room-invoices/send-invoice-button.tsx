"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendInvoiceToUnseenTenants } from "./actions";

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSend() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendInvoiceToUnseenTenants(invoiceId);
      setMessage(result.success ? `Đã gửi cho ${result.sent} người` : (result.error ?? "Có lỗi xảy ra."));
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {message && <span className="text-xs text-neutral-600">{message}</span>}
      <Button type="button" variant="secondary" isLoading={isPending} onClick={handleSend} className="px-3 py-1.5">
        Gửi
      </Button>
    </div>
  );
}

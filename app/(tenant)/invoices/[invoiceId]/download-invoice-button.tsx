"use client";

import { Button } from "@/components/ui/button";

// Dùng in trình duyệt (Save as PDF) thay vì thư viện tạo PDF phía client (jsPDF...) — các font
// PDF chuẩn (Helvetica/Times) không có đủ dấu tiếng Việt, còn in trình duyệt dùng font thật của
// máy nên chữ có dấu luôn đúng. CSS in nằm ở app/globals.css (@media print), chỉ giữ lại
// #invoice-print-area khi in — xem app/(tenant)/invoices/[invoiceId]/page.tsx.
export function DownloadInvoiceButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      Tải hóa đơn (PDF)
    </Button>
  );
}

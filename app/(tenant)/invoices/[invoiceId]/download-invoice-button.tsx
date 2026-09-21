"use client";

import { Button } from "@/components/ui/button";

// Dùng in trình duyệt (Save as PDF) thay vì thư viện tạo PDF phía client (jsPDF...) — các font
// PDF chuẩn (Helvetica/Times) không có đủ dấu tiếng Việt, còn in trình duyệt dùng font thật của
// máy nên chữ có dấu luôn đúng. CSS in nằm ở app/globals.css (@media print), chỉ giữ lại
// #invoice-print-area khi in — xem app/(tenant)/invoices/[invoiceId]/page.tsx.
export function DownloadInvoiceButton({ fileName }: { fileName: string }) {
  function handlePrint() {
    // Trình duyệt dùng document.title làm tên file gợi ý khi "Save as PDF".
    const originalTitle = document.title;
    document.title = fileName;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = originalTitle;
      },
      { once: true }
    );
    window.print();
  }

  return (
    <Button type="button" variant="secondary" onClick={handlePrint}>
      Tải hóa đơn (PDF)
    </Button>
  );
}

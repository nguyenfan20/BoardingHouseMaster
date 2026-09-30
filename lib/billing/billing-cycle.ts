// Kỳ tính tiền theo "ngày chốt" riêng của từng phòng (billing_config.billing_day).
// Pure function, có unit test — xem docs/BILLING.md § Kỳ tính tiền.

/** Chuẩn hoá billing_day về 1..31. */
export function normalizeBillingDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(31, Math.max(1, Math.trunc(day)));
}

/**
 * Tháng cần lập hóa đơn tại thời điểm `today`, trả về chuỗi "YYYY-MM-01".
 * Chưa tới ngày chốt → kỳ đang chốt vẫn là tháng trước.
 */
export function billingMonthFor(billingDay: number, today = new Date()): string {
  const day = normalizeBillingDay(billingDay);
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const shift = today.getDate() >= day ? 0 : -1;
  const d = new Date(year, month + shift, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Ngày chốt của kỳ hiện tại (để hiển thị "đã tới ngày chốt từ ...").
 * Nếu tháng không có đủ ngày (VD: tháng 2 chỉ có 28/29 ngày), dùng ngày cuối tháng.
 */
export function billingCycleDate(billingDay: number, today = new Date()): Date {
  const month = billingMonthFor(billingDay, today);
  const [y, m] = month.split("-").map(Number);
  const day = normalizeBillingDay(billingDay);
  // Số ngày thực tế của tháng (month 0-based: new Date(y, m, 0).getDate())
  const daysInMonth = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(day, daysInMonth));
}

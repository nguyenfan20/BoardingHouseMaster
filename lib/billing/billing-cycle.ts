// Kỳ tính tiền theo "ngày chốt" riêng của từng phòng (billing_config.billing_day).
// Pure function, có unit test — xem docs/BILLING.md § Kỳ tính tiền.

/** Chuẩn hoá billing_day về 1..28 (tháng 2 cũng luôn có ngày này). */
export function normalizeBillingDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.trunc(day)));
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

/** Ngày chốt của kỳ hiện tại (để hiển thị "đã tới ngày chốt từ ..."). */
export function billingCycleDate(billingDay: number, today = new Date()): Date {
  const month = billingMonthFor(billingDay, today);
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, normalizeBillingDay(billingDay));
}

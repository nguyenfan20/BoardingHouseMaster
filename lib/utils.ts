export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * "MM/YYYY" từ chuỗi ngày ISO (VD "2026-08-01"). Tự parse thay vì
 * `Date#toLocaleDateString("vi-VN", ...)` vì locale vi-VN tự chèn thêm chữ "tháng" vào kết
 * quả (gây lặp chữ khi ghép với label có sẵn), và vì "new Date('YYYY-MM-DD')" bị parse theo
 * UTC nên lấy getMonth()/getFullYear() có thể lệch 1 ngày/tháng tuỳ timezone máy chạy.
 */
export function formatMonthLabel(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${month}/${year}`;
}

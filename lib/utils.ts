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

/**
 * "dd/MM/YYYY HH:mm" từ timestamp ISO. Tự format theo giờ local của máy chạy thay vì
 * `toLocaleString("vi-VN")` để chuỗi luôn có padding 2 chữ số và không phụ thuộc locale
 * cài trên máy (cùng lý do với `formatMonthLabel`).
 */
export function formatDateTimeLabel(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

import { describe, expect, it } from "vitest";
import { billingCycleDate, billingMonthFor, normalizeBillingDay } from "../billing-cycle";

describe("normalizeBillingDay", () => {
  it("kẹp về khoảng 1..31", () => {
    expect(normalizeBillingDay(0)).toBe(1);
    expect(normalizeBillingDay(32)).toBe(31);
    expect(normalizeBillingDay(31)).toBe(31);
    expect(normalizeBillingDay(15)).toBe(15);
    expect(normalizeBillingDay(NaN)).toBe(1);
  });
});

describe("billingMonthFor", () => {
  it("đã qua ngày chốt → kỳ là tháng hiện tại", () => {
    expect(billingMonthFor(5, new Date(2026, 8, 13))).toBe("2026-09-01");
    expect(billingMonthFor(13, new Date(2026, 8, 13))).toBe("2026-09-01");
  });

  it("chưa tới ngày chốt → kỳ vẫn là tháng trước", () => {
    expect(billingMonthFor(20, new Date(2026, 8, 13))).toBe("2026-08-01");
  });

  it("lùi qua mốc năm", () => {
    expect(billingMonthFor(10, new Date(2026, 0, 3))).toBe("2025-12-01");
  });
});

describe("billingCycleDate", () => {
  it("trả ngày chốt của kỳ đang tính", () => {
    const d = billingCycleDate(20, new Date(2026, 8, 13));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // tháng 8
    expect(d.getDate()).toBe(20);
  });

  it("tháng không đủ ngày → dùng ngày cuối tháng (VD: ngày 31 trong tháng 2)", () => {
    // Tháng 2/2026 có 28 ngày → billing day 31 fallback về 28
    const d = billingCycleDate(31, new Date(2026, 2, 15)); // tháng 3, chưa tới ngày 31 → kỳ tháng 2
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1); // tháng 2
    expect(d.getDate()).toBe(28); // ngày cuối tháng 2
  });

  it("tháng 30 ngày với billing day 31 → dùng ngày 30", () => {
    const d = billingCycleDate(31, new Date(2026, 9, 5)); // tháng 10, chưa tới 31 → kỳ tháng 9
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // tháng 9 (30 ngày)
    expect(d.getDate()).toBe(30);
  });

  it("tháng đủ 31 ngày → dùng đúng ngày 31", () => {
    const d = billingCycleDate(31, new Date(2026, 7, 5)); // tháng 8, chưa tới 31 → kỳ tháng 7
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // tháng 7 (31 ngày)
    expect(d.getDate()).toBe(31);
  });
});

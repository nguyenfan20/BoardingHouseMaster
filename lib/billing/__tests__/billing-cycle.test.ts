import { describe, expect, it } from "vitest";
import { billingCycleDate, billingMonthFor, normalizeBillingDay } from "../billing-cycle";

describe("normalizeBillingDay", () => {
  it("kẹp về khoảng 1..28", () => {
    expect(normalizeBillingDay(0)).toBe(1);
    expect(normalizeBillingDay(31)).toBe(28);
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
});

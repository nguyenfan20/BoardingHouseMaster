import { describe, expect, it } from "vitest";
import { calculateDualMeterElectricity, calculateSingleMeterElectricity } from "../calculate-electricity";

describe("calculateSingleMeterElectricity", () => {
  it("tính đúng phòng thường có thuế điện", () => {
    const result = calculateSingleMeterElectricity({
      oldIndex: 100,
      newIndex: 150,
      electricityRate: 3500,
      electricityTaxPercent: 4.5,
    });
    expect(result.consumedKwh).toBe(50);
    expect(result.electricity).toBe(175000);
    expect(result.tax).toBeCloseTo(7875);
    expect(result.totalElectric).toBeCloseTo(182875);
  });

  it("không cộng gì thêm nếu tax = 0", () => {
    const result = calculateSingleMeterElectricity({
      oldIndex: 0,
      newIndex: 10,
      electricityRate: 3500,
      electricityTaxPercent: 0,
    });
    expect(result.totalElectric).toBe(35000);
  });
});

describe("calculateDualMeterElectricity", () => {
  it("mặt bằng: chỉ áp dụng phụ thu 10%, KHÔNG cộng thuế", () => {
    const result = calculateDualMeterElectricity({
      indoor: { oldIndex: 100, newIndex: 130 },
      outdoor: { oldIndex: 200, newIndex: 220 },
      electricityRate: 3500,
      electricityTaxPercent: 0,
      dualMeterSurchargePercent: 10,
    });
    expect(result.consumedIndoor).toBe(30);
    expect(result.consumedOutdoor).toBe(20);
    expect(result.consumedKwh).toBe(50);
    expect(result.electricity).toBe(175000);
    expect(result.surcharge).toBeCloseTo(17500);
    expect(result.tax).toBe(0);
    expect(result.totalElectric).toBeCloseTo(192500);
  });

  it("phòng thường 2 đồng hồ: chỉ áp dụng thuế 4.5%, KHÔNG cộng phụ thu", () => {
    const result = calculateDualMeterElectricity({
      indoor: { oldIndex: 0, newIndex: 30 },
      outdoor: { oldIndex: 0, newIndex: 20 },
      electricityRate: 3500,
      electricityTaxPercent: 4.5,
      dualMeterSurchargePercent: 0,
    });
    expect(result.surcharge).toBe(0);
    expect(result.tax).toBeCloseTo(7875);
    expect(result.totalElectric).toBeCloseTo(182875);
  });

  it("cả hai đều 0 -> tổng tiền điện = tiền điện gốc", () => {
    const result = calculateDualMeterElectricity({
      indoor: { oldIndex: 0, newIndex: 10 },
      outdoor: { oldIndex: 0, newIndex: 10 },
      electricityRate: 3500,
      electricityTaxPercent: 0,
      dualMeterSurchargePercent: 0,
    });
    expect(result.totalElectric).toBe(70000);
  });
});

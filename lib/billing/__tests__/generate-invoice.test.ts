import { describe, expect, it } from "vitest";
import { calculateInvoice } from "../generate-invoice";

describe("calculateInvoice", () => {
  it("tổng hợp đầy đủ, chỉ cộng extra_fees đã approved", () => {
    const result = calculateInvoice({
      basePrice: 2500000,
      electricity: {
        meterType: "single",
        input: { oldIndex: 100, newIndex: 150, electricityRate: 3500, electricityTaxPercent: 4.5 },
      },
      water: { calcType: "per_person", numOccupants: 2, waterRate: 150000 },
      extraFees: [
        { feeName: "Wifi", amount: 100000, status: "approved" },
        { feeName: "Thêm người (chờ duyệt)", amount: 200000, status: "pending" },
        { feeName: "Bị từ chối", amount: 50000, status: "rejected" },
      ],
    });

    expect(result.electricity.totalElectric).toBeCloseTo(182875);
    expect(result.water.water).toBe(300000);
    expect(result.extraFees.extraFeesTotal).toBe(100000);
    expect(result.extraFees.items).toHaveLength(1);
    expect(result.totalAmount).toBeCloseTo(2500000 + 182875 + 300000 + 100000);
  });

  it("mặt bằng 2 đồng hồ + nước per_m3, không extra fee", () => {
    const result = calculateInvoice({
      basePrice: 0,
      electricity: {
        meterType: "dual",
        input: {
          indoor: { oldIndex: 100, newIndex: 130 },
          outdoor: { oldIndex: 200, newIndex: 220 },
          electricityRate: 3500,
          electricityTaxPercent: 0,
          dualMeterSurchargePercent: 10,
        },
      },
      water: { calcType: "per_m3", oldIndex: 5, newIndex: 13, waterRate: 25000 },
      extraFees: [],
    });

    expect(result.electricity.totalElectric).toBeCloseTo(192500);
    expect(result.water.water).toBe(200000);
    expect(result.extraFees.extraFeesTotal).toBe(0);
    expect(result.totalAmount).toBeCloseTo(392500);
  });
});

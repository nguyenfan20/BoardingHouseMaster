// Tổng hợp hoá đơn: docs/BILLING.md §4-6. Pure function — nhận dữ liệu đã đọc từ DB, trả về
// breakdown + totalAmount. Việc đọc DB / upsert invoices / tạo notification nằm ở Server Action
// (docs/SERVER_ACTIONS.md § generateInvoice), KHÔNG ở đây, để hàm này test được độc lập.
import { calculateDualMeterElectricity, calculateSingleMeterElectricity } from "./calculate-electricity";
import { calculateWater } from "./calculate-water";
import type {
  DualMeterInput,
  ElectricityBreakdown,
  ExtraFeeItem,
  ExtraFeesBreakdown,
  InvoiceBreakdown,
  SingleMeterInput,
  WaterInput,
} from "./types";

export interface CalculateInvoiceInput {
  basePrice: number;
  electricity:
    | { meterType: "single"; input: SingleMeterInput }
    | { meterType: "dual"; input: DualMeterInput };
  water: WaterInput;
  extraFees: ExtraFeeItem[];
}

function calculateElectricity(
  electricity: CalculateInvoiceInput["electricity"]
): ElectricityBreakdown {
  return electricity.meterType === "single"
    ? calculateSingleMeterElectricity(electricity.input)
    : calculateDualMeterElectricity(electricity.input);
}

function calculateExtraFees(fees: ExtraFeeItem[]): ExtraFeesBreakdown {
  const approved = fees.filter((f) => f.status === "approved");
  return {
    items: approved.map(({ feeName, amount, note }) => ({ feeName, amount, note })),
    extraFeesTotal: approved.reduce((sum, f) => sum + f.amount, 0),
  };
}

export function calculateInvoice(input: CalculateInvoiceInput): InvoiceBreakdown {
  const electricity = calculateElectricity(input.electricity);
  const water = calculateWater(input.water);
  const extraFees = calculateExtraFees(input.extraFees);
  const totalAmount =
    input.basePrice + electricity.totalElectric + water.water + extraFees.extraFeesTotal;

  const rateInput = input.electricity.input;
  return {
    basePrice: input.basePrice,
    electricity,
    water,
    extraFees,
    totalAmount,
    ratesSnapshot: {
      electricityRate: rateInput.electricityRate,
      electricityTaxPercent: rateInput.electricityTaxPercent,
      dualMeterSurchargePercent:
        input.electricity.meterType === "dual" ? input.electricity.input.dualMeterSurchargePercent : 0,
      waterRate: input.water.waterRate,
    },
  };
}

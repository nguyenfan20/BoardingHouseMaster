// Công thức: docs/BILLING.md §1-2. Pure functions, không side effect.
import type {
  SingleMeterInput,
  SingleMeterBreakdown,
  DualMeterInput,
  DualMeterBreakdown,
} from "./types";

export function calculateSingleMeterElectricity(
  input: SingleMeterInput
): SingleMeterBreakdown {
  const consumedKwh = input.newIndex - input.oldIndex;
  const electricity = consumedKwh * input.electricityRate;
  const tax = electricity * (input.electricityTaxPercent / 100);
  const totalElectric = electricity + tax;

  return {
    meterType: "single",
    consumedKwh,
    electricity,
    tax,
    totalElectric,
  };
}

export function calculateDualMeterElectricity(
  input: DualMeterInput
): DualMeterBreakdown {
  const consumedIndoor = input.indoor.newIndex - input.indoor.oldIndex;
  const consumedOutdoor = input.outdoor.newIndex - input.outdoor.oldIndex;
  const consumedKwh = consumedIndoor + consumedOutdoor;
  const electricity = consumedKwh * input.electricityRate;

  // Chỉ MỘT trong hai áp dụng — xem docs/BILLING.md §2 (invariant).
  let surcharge = 0;
  let tax = 0;
  if (input.dualMeterSurchargePercent > 0) {
    surcharge = electricity * (input.dualMeterSurchargePercent / 100);
  } else {
    tax = electricity * (input.electricityTaxPercent / 100);
  }
  const totalElectric = electricity + surcharge + tax;

  return {
    meterType: "dual",
    consumedIndoor,
    consumedOutdoor,
    consumedKwh,
    electricity,
    surcharge,
    tax,
    totalElectric,
  };
}

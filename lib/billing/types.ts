// Kiểu dữ liệu dùng chung cho /lib/billing. Xem docs/BILLING.md.

export interface SingleMeterInput {
  oldIndex: number;
  newIndex: number;
  electricityRate: number;
  electricityTaxPercent: number;
}

export interface SingleMeterBreakdown {
  meterType: "single";
  consumedKwh: number;
  electricity: number;
  tax: number;
  totalElectric: number;
}

export interface DualMeterInput {
  indoor: { oldIndex: number; newIndex: number };
  outdoor: { oldIndex: number; newIndex: number };
  electricityRate: number;
  electricityTaxPercent: number;
  dualMeterSurchargePercent: number;
}

export interface DualMeterBreakdown {
  meterType: "dual";
  consumedIndoor: number;
  consumedOutdoor: number;
  consumedKwh: number;
  electricity: number;
  surcharge: number;
  tax: number;
  totalElectric: number;
}

export type ElectricityBreakdown = SingleMeterBreakdown | DualMeterBreakdown;

export type WaterCalcType = "per_person" | "fixed" | "per_m3";

export interface WaterInputPerPerson {
  calcType: "per_person";
  numOccupants: number;
  waterRate: number;
}

export interface WaterInputFixed {
  calcType: "fixed";
  waterRate: number;
}

export interface WaterInputPerM3 {
  calcType: "per_m3";
  oldIndex: number;
  newIndex: number;
  waterRate: number;
}

export type WaterInput = WaterInputPerPerson | WaterInputFixed | WaterInputPerM3;

export interface WaterBreakdown {
  calcType: WaterCalcType;
  waterRate: number;
  numOccupants?: number;
  consumedM3?: number;
  water: number;
}

export interface ExtraFeeItem {
  feeName: string;
  amount: number;
  note?: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface ExtraFeesBreakdown {
  items: { feeName: string; amount: number; note?: string | null }[];
  extraFeesTotal: number;
}

export interface InvoiceBreakdown {
  basePrice: number;
  electricity: ElectricityBreakdown;
  water: WaterBreakdown;
  extraFees: ExtraFeesBreakdown;
  totalAmount: number;
  ratesSnapshot: {
    electricityRate: number;
    electricityTaxPercent: number;
    dualMeterSurchargePercent: number;
    waterRate: number;
  };
}

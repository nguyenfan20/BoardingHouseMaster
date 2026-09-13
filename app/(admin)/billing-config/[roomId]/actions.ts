"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeBillingDay } from "@/lib/billing/billing-cycle";
import type { WaterCalcType } from "@/types";

export interface UpdateBillingConfigInput {
  electricityRate: number;
  electricityTaxPercent: number;
  hasDualMeter: boolean;
  dualMeterSurchargePercent: number;
  waterCalcType: WaterCalcType;
  waterRate: number;
  allowTenantMeterInput: boolean;
  billingDay: number;
  otherFees: { name: string; amount: number }[];
}

export interface UpdateBillingConfigResult {
  success: boolean;
  error?: string;
}

export async function updateBillingConfig(
  roomId: string,
  input: UpdateBillingConfigInput
): Promise<UpdateBillingConfigResult> {
  await requireAdmin();

  // Invariant: chỉ MỘT trong hai được > 0 tại một thời điểm — docs/BILLING.md §2.
  if (input.electricityTaxPercent > 0 && input.dualMeterSurchargePercent > 0) {
    return {
      success: false,
      error: "Không thể vừa có thuế điện vừa có phụ thu 2 đồng hồ cùng lúc — chỉ chọn một.",
    };
  }

  const cleanOtherFees = (input.otherFees ?? [])
    .filter((f) => f.name.trim() && !isNaN(Number(f.amount)) && Number(f.amount) >= 0)
    .map((f) => ({ name: f.name.trim(), amount: Number(f.amount) }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("billing_config")
    .update({
      electricity_rate: input.electricityRate,
      electricity_tax_percent: input.electricityTaxPercent,
      has_dual_meter: input.hasDualMeter,
      dual_meter_surcharge_percent: input.dualMeterSurchargePercent,
      water_calc_type: input.waterCalcType,
      water_rate: input.waterRate,
      allow_tenant_meter_input: input.allowTenantMeterInput,
      billing_day: normalizeBillingDay(input.billingDay),
      other_fees: cleanOtherFees,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId);

  if (error) return { success: false, error: "Không thể lưu cấu hình. Vui lòng thử lại." };

  revalidatePath("/billing-config");
  revalidatePath(`/billing-config/${roomId}`);
  return { success: true };
}

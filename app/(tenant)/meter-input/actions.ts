"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MeterType } from "@/types";

export interface SubmitResult {
  success: boolean;
  error?: string;
}

async function assertTenantCanInput(roomId: string) {
  const supabase = await createClient();
  const { data: config } = await supabase.from("billing_config").select("allow_tenant_meter_input").eq("room_id", roomId).single();
  if (!config?.allow_tenant_meter_input) {
    throw new Error("Phòng này chưa được phép tự nhập chỉ số. Vui lòng liên hệ quản lý.");
  }
  return supabase;
}

export async function submitMeterReading(
  month: string,
  meterType: MeterType,
  oldIndex: number,
  newIndex: number
): Promise<SubmitResult> {
  const { profile } = await requireRole("tenant");
  if (!profile.room_id) return { success: false, error: "Tài khoản chưa được gán phòng." };

  try {
    const supabase = await assertTenantCanInput(profile.room_id);
    const { error } = await supabase.from("meter_readings").upsert(
      {
        room_id: profile.room_id,
        month,
        meter_type: meterType,
        old_index: oldIndex,
        new_index: newIndex,
        recorded_by: "tenant",
      },
      { onConflict: "room_id,month,meter_type" }
    );
    if (error) return { success: false, error: "Không thể lưu chỉ số. Vui lòng thử lại." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }

  revalidatePath("/meter-input");
  return { success: true };
}

export async function submitWaterReading(month: string, oldIndex: number, newIndex: number): Promise<SubmitResult> {
  const { profile } = await requireRole("tenant");
  if (!profile.room_id) return { success: false, error: "Tài khoản chưa được gán phòng." };

  try {
    const supabase = await assertTenantCanInput(profile.room_id);
    const { error } = await supabase.from("water_readings").upsert(
      { room_id: profile.room_id, month, old_index: oldIndex, new_index: newIndex },
      { onConflict: "room_id,month" }
    );
    if (error) return { success: false, error: "Không thể lưu chỉ số nước. Vui lòng thử lại." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }

  revalidatePath("/meter-input");
  return { success: true };
}

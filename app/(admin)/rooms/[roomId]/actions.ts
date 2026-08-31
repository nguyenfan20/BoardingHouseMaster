"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildRegisterUrl, generateInviteToken, INVITE_EXPIRY_DAYS } from "@/lib/invites";
import { calculateInvoice, type CalculateInvoiceInput } from "@/lib/billing/generate-invoice";
import type { ExtraFeeItem } from "@/lib/billing/types";
import { buildVietQrUrl } from "@/lib/vietqr";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  return `${proto}://${host}`;
}

export async function createRoomInvite(roomId: string) {
  const { user } = await requireAdmin();
  const supabase = await createClient();

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("room_invites").insert({
    room_id: roomId,
    token,
    created_by: user.id,
    expires_at: expiresAt,
  });
  if (error) throw error;

  revalidatePath(`/rooms/${roomId}`);
  return { url: buildRegisterUrl(token, await getOrigin()) };
}

export async function revokeRoomInvite(inviteId: string, roomId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("used_at", null);
  if (error) throw error;

  revalidatePath(`/rooms/${roomId}`);
}

export interface GenerateInvoiceResult {
  success: boolean;
  error?: string;
  totalAmount?: number;
}

export async function generateInvoiceForRoom(roomId: string, month: string): Promise<GenerateInvoiceResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  const { data: config } = await supabase.from("billing_config").select("*").eq("room_id", roomId).single();
  if (!room || !config) return { success: false, error: "Thiếu thông tin phòng hoặc cấu hình tính tiền." };

  const { data: existing } = await supabase.from("invoices").select("id, status").eq("room_id", roomId).eq("month", month).maybeSingle();
  if (existing?.status === "paid") {
    return { success: false, error: "Hóa đơn tháng này đã thanh toán — không thể tạo lại." };
  }

  const { data: meterReadings } = await supabase.from("meter_readings").select("*").eq("room_id", roomId).eq("month", month);

  let electricity: CalculateInvoiceInput["electricity"];
  if (config.has_dual_meter) {
    const indoor = meterReadings?.find((m) => m.meter_type === "indoor");
    const outdoor = meterReadings?.find((m) => m.meter_type === "outdoor");
    if (!indoor || !outdoor) return { success: false, error: "Thiếu chỉ số điện (2 đồng hồ) của tháng này." };
    electricity = {
      meterType: "dual",
      input: {
        indoor: { oldIndex: indoor.old_index, newIndex: indoor.new_index },
        outdoor: { oldIndex: outdoor.old_index, newIndex: outdoor.new_index },
        electricityRate: config.electricity_rate,
        electricityTaxPercent: config.electricity_tax_percent,
        dualMeterSurchargePercent: config.dual_meter_surcharge_percent,
      },
    };
  } else {
    const single = meterReadings?.find((m) => m.meter_type === "single");
    if (!single) return { success: false, error: "Thiếu chỉ số điện của tháng này." };
    electricity = {
      meterType: "single",
      input: {
        oldIndex: single.old_index,
        newIndex: single.new_index,
        electricityRate: config.electricity_rate,
        electricityTaxPercent: config.electricity_tax_percent,
      },
    };
  }

  let water: CalculateInvoiceInput["water"];
  if (config.water_calc_type === "per_m3") {
    const { data: waterReading } = await supabase.from("water_readings").select("*").eq("room_id", roomId).eq("month", month).maybeSingle();
    if (!waterReading) return { success: false, error: "Thiếu chỉ số nước của tháng này." };
    water = { calcType: "per_m3", oldIndex: waterReading.old_index, newIndex: waterReading.new_index, waterRate: config.water_rate };
  } else if (config.water_calc_type === "per_person") {
    water = { calcType: "per_person", numOccupants: room.num_occupants, waterRate: config.water_rate };
  } else {
    water = { calcType: "fixed", waterRate: config.water_rate };
  }

  const { data: extraFeesRows } = await supabase
    .from("extra_fees")
    .select("fee_name, amount, note, status")
    .eq("room_id", roomId)
    .eq("month", month);
  const extraFees: ExtraFeeItem[] = (extraFeesRows ?? []).map((f) => ({
    feeName: f.fee_name,
    amount: f.amount,
    note: f.note,
    status: f.status,
  }));

  const breakdown = calculateInvoice({ basePrice: room.base_price, electricity, water, extraFees });

  const { data: bankInfo } = await supabase.from("bank_info").select("*").limit(1).maybeSingle();
  const qrUrl = bankInfo
    ? buildVietQrUrl({
        bankCode: bankInfo.bank_code,
        accountNo: bankInfo.account_no,
        accountName: bankInfo.account_name,
        amount: breakdown.totalAmount,
        addInfo: `Tien tro ${room.name} ${month.slice(0, 7)}`,
      })
    : null;

  const { error } = await supabase.from("invoices").upsert(
    {
      room_id: roomId,
      month,
      breakdown: breakdown as unknown as Record<string, unknown>,
      total_amount: breakdown.totalAmount,
      qr_url: qrUrl,
    },
    { onConflict: "room_id,month" }
  );
  if (error) return { success: false, error: "Không thể lưu hóa đơn. Vui lòng thử lại." };

  revalidatePath(`/rooms/${roomId}`);
  return { success: true, totalAmount: breakdown.totalAmount };
}

export async function listRoomInvites(roomId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room_invites")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data;
}

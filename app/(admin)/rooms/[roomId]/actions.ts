"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildRegisterUrl, generateInviteToken, INVITE_EXPIRY_DAYS } from "@/lib/invites";
import { calculateInvoice, type CalculateInvoiceInput } from "@/lib/billing/generate-invoice";
import type { ExtraFeeItem } from "@/lib/billing/types";
import { buildVietQrUrl } from "@/lib/vietqr";
import { createNotification } from "@/lib/notifications";
import { formatMonthLabel } from "@/lib/utils";
import type { Json, MeterType } from "@/types/database";

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

export interface UpsertReadingResult {
  success: boolean;
  error?: string;
}

/**
 * Admin nhập/sửa chỉ số điện của phòng. Luôn khả dụng, không phụ thuộc
 * `billing_config.allow_tenant_meter_input` — cờ đó chỉ mở thêm quyền cho tenant
 * (docs/SCHEMA.md Quyết định #3), admin thì lúc nào cũng phải nhập/sửa được.
 */
export async function upsertMeterReadingAsAdmin(
  roomId: string,
  month: string,
  meterType: MeterType,
  oldIndex: number,
  newIndex: number
): Promise<UpsertReadingResult> {
  await requireAdmin();
  if (newIndex < oldIndex) {
    return { success: false, error: "Chỉ số mới không được nhỏ hơn chỉ số cũ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meter_readings").upsert(
    {
      room_id: roomId,
      month,
      meter_type: meterType,
      old_index: oldIndex,
      new_index: newIndex,
      recorded_by: "admin",
    },
    { onConflict: "room_id,month,meter_type" }
  );
  if (error) return { success: false, error: "Không thể lưu chỉ số điện. Vui lòng thử lại." };

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/meter-input");
  return { success: true };
}

/** Chỉ dùng khi `water_calc_type = 'per_m3'`. */
export async function upsertWaterReadingAsAdmin(
  roomId: string,
  month: string,
  oldIndex: number,
  newIndex: number
): Promise<UpsertReadingResult> {
  await requireAdmin();
  if (newIndex < oldIndex) {
    return { success: false, error: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("water_readings").upsert(
    { room_id: roomId, month, old_index: oldIndex, new_index: newIndex },
    { onConflict: "room_id,month" }
  );
  if (error) return { success: false, error: "Không thể lưu chỉ số nước. Vui lòng thử lại." };

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/meter-input");
  return { success: true };
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

  const otherFees = Array.isArray(config.other_fees)
    ? (config.other_fees as { name: string; amount: number }[]).filter(
        (f) => f.name?.trim() && Number(f.amount) > 0
      )
    : [];

  // Lấy tất cả phụ phí đã duyệt (status = 'approved') của phòng từ tháng này trở về trước
  const { data: allApprovedFees } = await supabase
    .from("extra_fees")
    .select("id, fee_name, amount, note, status, month, invoice_id")
    .eq("room_id", roomId)
    .eq("status", "approved")
    .lte("month", month);

  // Lấy danh sách các hóa đơn của phòng để biết hóa đơn nào đã thanh toán
  const { data: roomInvoices } = await supabase
    .from("invoices")
    .select("id, month, status")
    .eq("room_id", roomId);

  const paidInvoiceIds = new Set(
    (roomInvoices ?? []).filter((inv) => inv.status === "paid").map((inv) => inv.id)
  );
  const paidMonths = new Set(
    (roomInvoices ?? []).filter((inv) => inv.status === "paid").map((inv) => inv.month)
  );

  // Lọc các phụ phí hợp lệ đưa vào hóa đơn tháng này:
  // 1. Chưa từng nằm trong hóa đơn nào ĐÃ THANH TOÁN (!paidInvoiceIds.has(fee.invoice_id)).
  // 2. Và thoả mãn:
  //    - Hoặc là phụ phí của chính tháng này (fee.month === month).
  //    - Hoặc là phụ phí của các tháng trước (fee.month < month) mà hóa đơn tháng đó đã thanh toán rồi (paidMonths.has(fee.month)) hoặc chưa từng được gắn hóa đơn.
  const eligibleFees = (allApprovedFees ?? []).filter((fee) => {
    if (fee.invoice_id && paidInvoiceIds.has(fee.invoice_id)) {
      return false; // Đã nằm trong hóa đơn đã thanh toán
    }
    if (fee.month === month) {
      return true; // Phụ phí của tháng hiện tại
    }
    if (fee.month < month) {
      // Phụ phí từ tháng trước -> chỉ chuyển sang tháng này nếu tháng cũ đã thanh toán hoặc chưa được lập hóa đơn
      return !fee.invoice_id || paidMonths.has(fee.month);
    }
    return false;
  });

  const extraFees: ExtraFeeItem[] = eligibleFees.map((f) => {
    const isRollover = f.month < month;
    const feeName = isRollover ? `${f.fee_name} (T${formatMonthLabel(f.month)})` : f.fee_name;
    const note = isRollover
      ? `Bổ sung từ tháng ${formatMonthLabel(f.month)}${f.note ? ` · ${f.note}` : ""}`
      : f.note;
    return {
      feeName,
      amount: f.amount ?? null,
      note,
      status: f.status as ExtraFeeItem["status"],
    };
  });

  const breakdown = calculateInvoice({ basePrice: room.base_price, electricity, water, otherFees, extraFees });

  const { data: bankInfo } = await supabase.from("bank_info").select("*").limit(1).maybeSingle();
  const qrUrl = bankInfo
    ? buildVietQrUrl({
        bankCode: bankInfo.bank_code,
        accountNo: bankInfo.account_no,
        accountName: bankInfo.account_name,
        amount: breakdown.totalAmount,
        addInfo: "Chuyen khoan qua QR",
      })
    : null;

  const { data: savedInvoice, error } = await supabase
    .from("invoices")
    .upsert(
      {
        room_id: roomId,
        month,
        breakdown: breakdown as unknown as Json,
        total_amount: breakdown.totalAmount,
        qr_url: qrUrl,
      },
      { onConflict: "room_id,month" }
    )
    .select("id")
    .single();

  if (error || !savedInvoice) return { success: false, error: "Không thể lưu hóa đơn. Vui lòng thử lại." };

  // Gắn invoice_id cho các phụ phí đã được đưa vào hóa đơn này
  const eligibleFeeIds = eligibleFees.map((f) => f.id);
  if (eligibleFeeIds.length > 0) {
    await supabase
      .from("extra_fees")
      .update({ invoice_id: savedInvoice.id })
      .in("id", eligibleFeeIds);
  }

  // Chỉ báo khi hóa đơn được tạo MỚI, không báo lại mỗi lần admin bấm cập nhật
  // (docs/NOTIFICATIONS.md § Khi nào tạo notification).
  if (!existing) {
    try {
      const { data: tenants } = await supabase.from("users").select("id").eq("room_id", roomId);
      for (const t of tenants ?? []) {
        await createNotification({
          userId: t.id,
          type: "invoice_created",
          title: `Hóa đơn tháng ${formatMonthLabel(month)} đã sẵn sàng`,
          body: `Tổng tiền ${breakdown.totalAmount.toLocaleString("vi-VN")} đ.`,
          relatedTable: "invoices",
          relatedId: savedInvoice.id,
        });
      }
    } catch {
      // Non-blocking
    }
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/invoices");
  return { success: true, totalAmount: breakdown.totalAmount };
}

export async function markInvoicePaid(invoiceId: string, roomId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)
    .select("id, room_id, month, total_amount")
    .single();

  if (error || !invoice) throw error ?? new Error("Không thể cập nhật hóa đơn.");

  // Thông báo cho các tenant trong phòng
  try {
    const { data: tenants } = await supabase.from("users").select("id").eq("room_id", roomId);
    if (tenants && tenants.length > 0) {
      for (const t of tenants) {
        await createNotification({
          userId: t.id,
          type: "invoice_paid",
          title: `Hóa đơn tháng ${formatMonthLabel(invoice.month)} đã thanh toán`,
          body: `Hóa đơn số tiền ${invoice.total_amount.toLocaleString("vi-VN")} đ đã được xác nhận thanh toán.`,
          relatedTable: "invoices",
          relatedId: invoice.id,
        });
      }
    }
  } catch {
    // Non-blocking
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/dashboard");
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

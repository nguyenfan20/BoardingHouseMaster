import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizeBillingDay, billingMonthFor } from "@/lib/billing/billing-cycle";
import { calculateInvoice, type CalculateInvoiceInput } from "@/lib/billing/generate-invoice";
import { buildVietQrUrl } from "@/lib/vietqr";
import { formatMonthLabel } from "@/lib/utils";
import type { ExtraFeeItem } from "@/lib/billing/types";
import type { Database, Json } from "@/types/database";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tạo Supabase client service-role cho API Route.
 * Không dùng `lib/supabase/server.ts` vì createClient() đó cần cookies (Server Component),
 * còn API Route cron thì không có session user — cần bypass RLS hoàn toàn.
 */
function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Kiểm tra CRON_SECRET trong header để chống gọi trái phép. */
function verifyCronSecret(request: Request): boolean {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  return secret === process.env.CRON_SECRET;
}

/** Ghi notification cho tất cả tenant trong phòng. */
async function notifyTenants(
  supabase: ReturnType<typeof createServiceClient>,
  roomId: string,
  invoiceId: string,
  month: string,
  totalAmount: number
) {
  const { data: tenants } = await supabase.from("users").select("id").eq("room_id", roomId);
  for (const t of tenants ?? []) {
    await supabase.from("notifications").insert({
      user_id: t.id,
      type: "invoice_created",
      title: `Hóa đơn tháng ${formatMonthLabel(month)} đã sẵn sàng`,
      body: `Tổng tiền ${totalAmount.toLocaleString("vi-VN")} đ.`,
      related_table: "invoices",
      related_id: invoiceId,
    });
  }
}

// ─── Kiểu dữ liệu nội bộ ─────────────────────────────────────────────────

interface RoomResult {
  roomId: string;
  roomName: string;
  status: "created" | "skipped_exists" | "skipped_missing_meter" | "skipped_missing_water" | "error";
  month: string;
  totalAmount?: number;
  error?: string;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date();
  const results: RoomResult[] = [];

  // 1) Lấy tất cả phòng active + cấu hình tính tiền
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, base_price, num_occupants, is_active")
    .eq("is_active", true);

  const { data: configs } = await supabase.from("billing_config").select("*");

  if (!rooms || !configs) {
    return NextResponse.json({ error: "Không thể đọc dữ liệu phòng / cấu hình." }, { status: 500 });
  }

  const configByRoomId = new Map(configs.map((c) => [c.room_id, c]));

  // 2) Lấy danh sách hóa đơn đã có để kiểm tra trùng
  const { data: existingInvoices } = await supabase.from("invoices").select("room_id, month, status");
  const invoiceMap = new Map((existingInvoices ?? []).map((inv) => [`${inv.room_id}:${inv.month}`, inv]));

  // 3) Lấy thông tin ngân hàng để tạo QR
  const { data: bankInfo } = await supabase.from("bank_info").select("*").limit(1).maybeSingle();

  // 4) Duyệt từng phòng
  for (const room of rooms) {
    const config = configByRoomId.get(room.id);
    if (!config) continue;

    const billingDay = normalizeBillingDay(config.billing_day);
    const month = billingMonthFor(billingDay, today);

    // Chưa tới ngày chốt → bỏ qua (billingMonthFor đã xử lý: nếu chưa tới ngày chốt,
    // tháng trả về là tháng trước — nhưng ta chỉ tạo hóa đơn nếu hôm nay >= ngày chốt)
    if (today.getDate() < billingDay) {
      // Tuy nhiên cần kiểm tra thêm: nếu ngày chốt > số ngày trong tháng hiện tại
      // (VD: ngày chốt 31 nhưng tháng chỉ có 30 ngày), thì vẫn coi như đã tới
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      if (billingDay > daysInCurrentMonth && today.getDate() >= daysInCurrentMonth) {
        // OK — tới ngày cuối tháng rồi, coi như đã tới ngày chốt
      } else {
        continue;
      }
    }

    // Đã có hóa đơn cho kỳ này?
    const existingKey = `${room.id}:${month}`;
    const existing = invoiceMap.get(existingKey);
    if (existing) {
      results.push({ roomId: room.id, roomName: room.name, status: "skipped_exists", month });
      continue;
    }

    // ── Chuẩn bị dữ liệu tính hóa đơn ──

    try {
      // Đọc chỉ số điện
      const { data: meterReadings } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("room_id", room.id)
        .eq("month", month);

      let electricity: CalculateInvoiceInput["electricity"];
      if (config.has_dual_meter) {
        const indoor = meterReadings?.find((m) => m.meter_type === "indoor");
        const outdoor = meterReadings?.find((m) => m.meter_type === "outdoor");
        if (!indoor || !outdoor) {
          results.push({ roomId: room.id, roomName: room.name, status: "skipped_missing_meter", month });
          continue;
        }
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
        if (!single) {
          results.push({ roomId: room.id, roomName: room.name, status: "skipped_missing_meter", month });
          continue;
        }
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

      // Đọc chỉ số nước
      let water: CalculateInvoiceInput["water"];
      if (config.water_calc_type === "per_m3") {
        const { data: waterReading } = await supabase
          .from("water_readings")
          .select("*")
          .eq("room_id", room.id)
          .eq("month", month)
          .maybeSingle();
        if (!waterReading) {
          results.push({ roomId: room.id, roomName: room.name, status: "skipped_missing_water", month });
          continue;
        }
        water = {
          calcType: "per_m3",
          oldIndex: waterReading.old_index,
          newIndex: waterReading.new_index,
          waterRate: config.water_rate,
        };
      } else if (config.water_calc_type === "per_person") {
        water = { calcType: "per_person", numOccupants: room.num_occupants, waterRate: config.water_rate };
      } else {
        water = { calcType: "fixed", waterRate: config.water_rate };
      }

      // Phí cố định từ cấu hình
      const otherFees = Array.isArray(config.other_fees)
        ? (config.other_fees as { name: string; amount: number }[]).filter(
            (f) => f.name?.trim() && Number(f.amount) > 0
          )
        : [];

      // Phụ phí đã duyệt (extra_fees) — logic giống generateInvoiceForRoom trong actions.ts
      const { data: allApprovedFees } = await supabase
        .from("extra_fees")
        .select("id, fee_name, amount, note, status, month, invoice_id")
        .eq("room_id", room.id)
        .eq("status", "approved")
        .lte("month", month);

      const { data: roomInvoices } = await supabase
        .from("invoices")
        .select("id, month, status")
        .eq("room_id", room.id);

      const paidInvoiceIds = new Set(
        (roomInvoices ?? []).filter((inv) => inv.status === "paid").map((inv) => inv.id)
      );
      const paidMonths = new Set(
        (roomInvoices ?? []).filter((inv) => inv.status === "paid").map((inv) => inv.month)
      );

      const eligibleFees = (allApprovedFees ?? []).filter((fee) => {
        if (fee.invoice_id && paidInvoiceIds.has(fee.invoice_id)) return false;
        if (fee.month === month) return true;
        if (fee.month < month) return !fee.invoice_id || paidMonths.has(fee.month);
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

      // ── Tính hóa đơn ──
      const breakdown = calculateInvoice({ basePrice: room.base_price, electricity, water, otherFees, extraFees });

      const qrUrl = bankInfo
        ? buildVietQrUrl({
            bankCode: bankInfo.bank_code,
            accountNo: bankInfo.account_no,
            accountName: bankInfo.account_name,
            amount: breakdown.totalAmount,
            addInfo: "Chuyen khoan qua QR",
          })
        : null;

      // ── Lưu hóa đơn ──
      const { data: savedInvoice, error: saveError } = await supabase
        .from("invoices")
        .upsert(
          {
            room_id: room.id,
            month,
            breakdown: breakdown as unknown as Json,
            total_amount: breakdown.totalAmount,
            qr_url: qrUrl,
          },
          { onConflict: "room_id,month" }
        )
        .select("id")
        .single();

      if (saveError || !savedInvoice) {
        results.push({
          roomId: room.id,
          roomName: room.name,
          status: "error",
          month,
          error: saveError?.message ?? "Không thể lưu hóa đơn.",
        });
        continue;
      }

      // Gắn invoice_id cho extra_fees
      const eligibleFeeIds = eligibleFees.map((f) => f.id);
      if (eligibleFeeIds.length > 0) {
        await supabase.from("extra_fees").update({ invoice_id: savedInvoice.id }).in("id", eligibleFeeIds);
      }

      // Thông báo tenant
      await notifyTenants(supabase, room.id, savedInvoice.id, month, breakdown.totalAmount);

      results.push({
        roomId: room.id,
        roomName: room.name,
        status: "created",
        month,
        totalAmount: breakdown.totalAmount,
      });
    } catch (err) {
      results.push({
        roomId: room.id,
        roomName: room.name,
        status: "error",
        month,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const created = results.filter((r) => r.status === "created");
  const skippedMeter = results.filter((r) => r.status === "skipped_missing_meter");
  const skippedWater = results.filter((r) => r.status === "skipped_missing_water");
  const errors = results.filter((r) => r.status === "error");

  return NextResponse.json({
    ok: true,
    summary: {
      total: rooms.length,
      created: created.length,
      skippedExists: results.filter((r) => r.status === "skipped_exists").length,
      skippedMissingMeter: skippedMeter.length,
      skippedMissingWater: skippedWater.length,
      errors: errors.length,
    },
    results,
  });
}

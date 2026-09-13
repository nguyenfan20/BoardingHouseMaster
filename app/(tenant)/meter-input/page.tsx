import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel } from "@/lib/utils";
import type { WaterCalcType } from "@/types";
import { MeterInputForm } from "./meter-input-form";

export const dynamic = "force-dynamic";

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function TenantMeterInputPage() {
  const result = await getCurrentProfile();
  const roomId = result?.profile.room_id;
  const month = currentMonthIso();

  if (!roomId) {
    return <p className="text-sm text-neutral-600">Tài khoản chưa được gán phòng.</p>;
  }

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("billing_config")
    .select("allow_tenant_meter_input, has_dual_meter, water_calc_type")
    .eq("room_id", roomId)
    .single();

  if (!config?.allow_tenant_meter_input) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">
        Phòng của bạn chưa được quản lý cho phép tự nhập chỉ số điện/nước. Vui lòng liên hệ quản lý nếu cần cập nhật.
      </div>
    );
  }

  // Fetch full history (last 12 months) for both tables in parallel
  const [{ data: allMeterReadings }, { data: allWaterReadings }] = await Promise.all([
    supabase
      .from("meter_readings")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(36), // dual meter = 2 rows/month → 36 covers 12 months
    config.water_calc_type === "per_m3"
      ? supabase
          .from("water_readings")
          .select("*")
          .eq("room_id", roomId)
          .order("month", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const meterReadings = allMeterReadings ?? [];
  const waterReadings = allWaterReadings ?? [];

  // Current month slice — passed to form inputs as default values
  const currentMeterReadings = meterReadings.filter((r) => r.month === month);
  const currentWaterReading = waterReadings.find((r) => r.month === month) ?? null;

  // Determine if the current month is fully submitted
  const hasElectricity = config.has_dual_meter
    ? currentMeterReadings.some((r) => r.meter_type === "indoor") &&
      currentMeterReadings.some((r) => r.meter_type === "outdoor")
    : currentMeterReadings.some((r) => r.meter_type === "single");
  const hasWater =
    config.water_calc_type !== "per_m3" || currentWaterReading !== null;
  const isCurrentMonthComplete = hasElectricity && hasWater;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Nhập chỉ số</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Tháng {formatMonthLabel(month)}
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
        <MeterInputForm
          month={month}
          hasDualMeter={config.has_dual_meter}
          waterCalcType={config.water_calc_type as WaterCalcType}
          currentMeterReadings={currentMeterReadings}
          currentWaterReading={currentWaterReading}
          isCurrentMonthComplete={isCurrentMonthComplete}
          meterHistory={meterReadings}
          waterHistory={waterReadings}
        />
      </div>
    </div>
  );
}

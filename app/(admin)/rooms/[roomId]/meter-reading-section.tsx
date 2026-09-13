"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils";
import { billingMonthFor } from "@/lib/billing/billing-cycle";
import type { Database, WaterCalcType } from "@/types/database";
import { upsertMeterReadingAsAdmin, upsertWaterReadingAsAdmin } from "./actions";

type MeterReading = Database["public"]["Tables"]["meter_readings"]["Row"];
type WaterReading = Database["public"]["Tables"]["water_readings"]["Row"];

/** Chỉ số cũ gợi ý: chỉ số mới của tháng gần nhất trước `month` cùng loại đồng hồ. */
function previousNewIndex<T extends { month: string; new_index: number }>(rows: T[], month: string) {
  return rows
    .filter((r) => r.month < month)
    .sort((a, b) => b.month.localeCompare(a.month))[0]?.new_index;
}

export function MeterReadingSection({
  roomId,
  billingDay,
  hasDualMeter,
  waterCalcType,
  meterReadings,
  waterReadings,
}: {
  roomId: string;
  billingDay: number;
  hasDualMeter: boolean;
  waterCalcType: WaterCalcType;
  meterReadings: MeterReading[];
  waterReadings: WaterReading[];
}) {
  // Mặc định là kỳ đang chốt của phòng, giống ô tháng của form tạo hóa đơn.
  const [monthInput, setMonthInput] = useState(() => billingMonthFor(billingDay).slice(0, 7));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const month = `${monthInput}-01`;
  const forMonth = (type: MeterReading["meter_type"]) =>
    meterReadings.find((r) => r.month === month && r.meter_type === type);
  const single = forMonth("single");
  const indoor = forMonth("indoor");
  const outdoor = forMonth("outdoor");
  const water = waterReadings.find((r) => r.month === month);

  const singleRows = meterReadings.filter((r) => r.meter_type === "single");
  const indoorRows = meterReadings.filter((r) => r.meter_type === "indoor");
  const outdoorRows = meterReadings.filter((r) => r.meter_type === "outdoor");

  const hasReading = hasDualMeter ? Boolean(indoor && outdoor) : Boolean(single);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      if (hasDualMeter) {
        const r1 = await upsertMeterReadingAsAdmin(roomId, month, "indoor", Number(fd.get("indoorOld")), Number(fd.get("indoorNew")));
        if (!r1.success) return setError(r1.error ?? "Có lỗi xảy ra.");
        const r2 = await upsertMeterReadingAsAdmin(roomId, month, "outdoor", Number(fd.get("outdoorOld")), Number(fd.get("outdoorNew")));
        if (!r2.success) return setError(r2.error ?? "Có lỗi xảy ra.");
      } else {
        const r = await upsertMeterReadingAsAdmin(roomId, month, "single", Number(fd.get("singleOld")), Number(fd.get("singleNew")));
        if (!r.success) return setError(r.error ?? "Có lỗi xảy ra.");
      }

      if (waterCalcType === "per_m3") {
        const rw = await upsertWaterReadingAsAdmin(roomId, month, Number(fd.get("waterOld")), Number(fd.get("waterNew")));
        if (!rw.success) return setError(rw.error ?? "Có lỗi xảy ra.");
      }

      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id="readingMonth"
        label="Tháng của chỉ số"
        type="month"
        value={monthInput}
        onChange={(e) => {
          setMonthInput(e.target.value);
          setSaved(false);
          setError(null);
        }}
        className="sm:w-48"
      />

      <p className="text-xs text-neutral-500">
        {hasReading
          ? `Đã có chỉ số tháng ${formatMonthLabel(month)} — lưu lại sẽ ghi đè.`
          : `Chưa có chỉ số tháng ${formatMonthLabel(month)}.`}
      </p>

      {/* key: đổi tháng thì remount để defaultValue lấy lại theo tháng mới */}
      <form key={month} onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">Chỉ số điện</h3>
        {hasDualMeter ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="indoorOld" name="indoorOld" label="Đồng hồ trong — chỉ số cũ" type="number" min={0} defaultValue={indoor?.old_index ?? previousNewIndex(indoorRows, month)} required />
            <Input id="indoorNew" name="indoorNew" label="Đồng hồ trong — chỉ số mới" type="number" min={0} defaultValue={indoor?.new_index} required />
            <Input id="outdoorOld" name="outdoorOld" label="Đồng hồ ngoài — chỉ số cũ" type="number" min={0} defaultValue={outdoor?.old_index ?? previousNewIndex(outdoorRows, month)} required />
            <Input id="outdoorNew" name="outdoorNew" label="Đồng hồ ngoài — chỉ số mới" type="number" min={0} defaultValue={outdoor?.new_index} required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="singleOld" name="singleOld" label="Chỉ số cũ" type="number" min={0} defaultValue={single?.old_index ?? previousNewIndex(singleRows, month)} required />
            <Input id="singleNew" name="singleNew" label="Chỉ số mới" type="number" min={0} defaultValue={single?.new_index} required />
          </div>
        )}

        {waterCalcType === "per_m3" && (
          <>
            <h3 className="text-sm font-semibold text-neutral-900">Chỉ số nước</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="waterOld" name="waterOld" label="Chỉ số cũ (m³)" type="number" min={0} defaultValue={water?.old_index ?? previousNewIndex(waterReadings, month)} required />
              <Input id="waterNew" name="waterNew" label="Chỉ số mới (m³)" type="number" min={0} defaultValue={water?.new_index} required />
            </div>
          </>
        )}

        {error && <p className="text-sm text-error-600">{error}</p>}
        {saved && <p className="text-sm text-brand-700">Đã lưu chỉ số tháng {formatMonthLabel(month)}.</p>}

        <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
          Lưu chỉ số
        </Button>
      </form>
    </div>
  );
}

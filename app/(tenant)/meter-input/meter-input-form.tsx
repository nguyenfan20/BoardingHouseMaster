"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database, WaterCalcType } from "@/types/database";
import { submitMeterReading, submitWaterReading } from "./actions";

type MeterReading = Database["public"]["Tables"]["meter_readings"]["Row"];
type WaterReading = Database["public"]["Tables"]["water_readings"]["Row"];

export function MeterInputForm({
  month,
  hasDualMeter,
  waterCalcType,
  meterReadings,
  waterReading,
}: {
  month: string;
  hasDualMeter: boolean;
  waterCalcType: WaterCalcType;
  meterReadings: MeterReading[];
  waterReading: WaterReading | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const single = meterReadings.find((m) => m.meter_type === "single");
  const indoor = meterReadings.find((m) => m.meter_type === "indoor");
  const outdoor = meterReadings.find((m) => m.meter_type === "outdoor");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      if (hasDualMeter) {
        const r1 = await submitMeterReading(month, "indoor", Number(fd.get("indoorOld")), Number(fd.get("indoorNew")));
        if (!r1.success) return setError(r1.error ?? "Có lỗi xảy ra.");
        const r2 = await submitMeterReading(month, "outdoor", Number(fd.get("outdoorOld")), Number(fd.get("outdoorNew")));
        if (!r2.success) return setError(r2.error ?? "Có lỗi xảy ra.");
      } else {
        const r = await submitMeterReading(month, "single", Number(fd.get("singleOld")), Number(fd.get("singleNew")));
        if (!r.success) return setError(r.error ?? "Có lỗi xảy ra.");
      }

      if (waterCalcType === "per_m3") {
        const rw = await submitWaterReading(month, Number(fd.get("waterOld")), Number(fd.get("waterNew")));
        if (!rw.success) return setError(rw.error ?? "Có lỗi xảy ra.");
      }

      setSaved(true);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-900">Chỉ số điện</h3>
      {hasDualMeter ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="indoorOld" name="indoorOld" label="Đồng hồ trong — chỉ số cũ" type="number" defaultValue={indoor?.old_index} required />
          <Input id="indoorNew" name="indoorNew" label="Đồng hồ trong — chỉ số mới" type="number" defaultValue={indoor?.new_index} required />
          <Input id="outdoorOld" name="outdoorOld" label="Đồng hồ ngoài — chỉ số cũ" type="number" defaultValue={outdoor?.old_index} required />
          <Input id="outdoorNew" name="outdoorNew" label="Đồng hồ ngoài — chỉ số mới" type="number" defaultValue={outdoor?.new_index} required />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="singleOld" name="singleOld" label="Chỉ số cũ" type="number" defaultValue={single?.old_index} required />
          <Input id="singleNew" name="singleNew" label="Chỉ số mới" type="number" defaultValue={single?.new_index} required />
        </div>
      )}

      {waterCalcType === "per_m3" && (
        <>
          <h3 className="text-sm font-semibold text-neutral-900">Chỉ số nước</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="waterOld" name="waterOld" label="Chỉ số cũ (m³)" type="number" defaultValue={waterReading?.old_index} required />
            <Input id="waterNew" name="waterNew" label="Chỉ số mới (m³)" type="number" defaultValue={waterReading?.new_index} required />
          </div>
        </>
      )}

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã lưu chỉ số tháng này.</p>}

      <Button type="submit" isLoading={isPending}>
        Lưu chỉ số
      </Button>
    </form>
  );
}

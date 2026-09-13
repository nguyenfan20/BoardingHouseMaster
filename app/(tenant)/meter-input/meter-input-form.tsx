"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils";
import type { Database, WaterCalcType } from "@/types/database";
import { submitMeterReading, submitWaterReading } from "./actions";

type MeterReading = Database["public"]["Tables"]["meter_readings"]["Row"];
type WaterReading = Database["public"]["Tables"]["water_readings"]["Row"];

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Collect all unique months that appear across meter + water readings, newest first */
function collectHistoryMonths(
  meterHistory: MeterReading[],
  waterHistory: WaterReading[]
): string[] {
  const months = new Set([
    ...meterHistory.map((r) => r.month),
    ...waterHistory.map((r) => r.month),
  ]);
  return [...months].sort((a, b) => b.localeCompare(a));
}

// ─── component ───────────────────────────────────────────────────────────────

export function MeterInputForm({
  month,
  hasDualMeter,
  waterCalcType,
  currentMeterReadings,
  currentWaterReading,
  isCurrentMonthComplete,
  meterHistory,
  waterHistory,
}: {
  month: string;
  hasDualMeter: boolean;
  waterCalcType: WaterCalcType;
  currentMeterReadings: MeterReading[];
  currentWaterReading: WaterReading | null;
  isCurrentMonthComplete: boolean;
  meterHistory: MeterReading[];
  waterHistory: WaterReading[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // optimistic: once saved in this session, treat as complete
  const [savedThisSession, setSavedThisSession] = useState(false);

  const locked = isCurrentMonthComplete || savedThisSession;

  const single = currentMeterReadings.find((m) => m.meter_type === "single");
  const indoor = currentMeterReadings.find((m) => m.meter_type === "indoor");
  const outdoor = currentMeterReadings.find((m) => m.meter_type === "outdoor");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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

      setSavedThisSession(true);
    } finally {
      setIsPending(false);
    }
  }

  // ── history months (exclude current month — it's shown in the form section) ──
  const historyMonths = collectHistoryMonths(meterHistory, waterHistory).filter(
    (m) => m !== month
  );

  return (
    <div className="space-y-8">

      {/* ── Input section ──────────────────────────────────────────────────── */}
      {locked ? (
        /* Already submitted this month */
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-brand-700">
              Đã nhập chỉ số tháng {formatMonthLabel(month)}
            </p>
            <p className="text-xs text-brand-600">
              Tháng tới bạn có thể nhập lại.
            </p>
          </div>
        </div>
      ) : (
        /* Input form */
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
                <Input id="waterOld" name="waterOld" label="Chỉ số cũ (m³)" type="number" defaultValue={currentWaterReading?.old_index} required />
                <Input id="waterNew" name="waterNew" label="Chỉ số mới (m³)" type="number" defaultValue={currentWaterReading?.new_index} required />
              </div>
            </>
          )}

          {error && <p className="text-sm text-error-600">{error}</p>}

          <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
            Lưu chỉ số
          </Button>
        </form>
      )}

      {/* ── History section ─────────────────────────────────────────────────── */}
      {historyMonths.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">
            Lịch sử nhập chỉ số
          </h3>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium text-neutral-600">
                  <th className="whitespace-nowrap px-4 py-2.5">Tháng</th>
                  {hasDualMeter ? (
                    <>
                      <th className="whitespace-nowrap px-4 py-2.5">Điện trong</th>
                      <th className="whitespace-nowrap px-4 py-2.5">Điện ngoài</th>
                    </>
                  ) : (
                    <th className="whitespace-nowrap px-4 py-2.5">Điện (cũ → mới)</th>
                  )}
                  {waterCalcType === "per_m3" && (
                    <th className="whitespace-nowrap px-4 py-2.5">Nước (m³)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {historyMonths.map((m) => {
                  const sRow = meterHistory.find((r) => r.month === m && r.meter_type === "single");
                  const inRow = meterHistory.find((r) => r.month === m && r.meter_type === "indoor");
                  const outRow = meterHistory.find((r) => r.month === m && r.meter_type === "outdoor");
                  const wRow = waterHistory.find((r) => r.month === m);

                  return (
                    <tr key={m} className="bg-white">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {formatMonthLabel(m)}
                      </td>
                      {hasDualMeter ? (
                        <>
                          <td className="px-4 py-3 text-neutral-600">
                            {inRow ? `${inRow.old_index} → ${inRow.new_index}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {outRow ? `${outRow.old_index} → ${outRow.new_index}` : "—"}
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-neutral-600">
                          {sRow ? `${sRow.old_index} → ${sRow.new_index}` : "—"}
                        </td>
                      )}
                      {waterCalcType === "per_m3" && (
                        <td className="px-4 py-3 text-neutral-600">
                          {wRow ? `${wRow.old_index} → ${wRow.new_index}` : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

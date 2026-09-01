"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database, WaterCalcType } from "@/types/database";
import { updateBillingConfig } from "./actions";

type BillingConfig = Database["public"]["Tables"]["billing_config"]["Row"];

const WATER_CALC_OPTIONS: { value: WaterCalcType; label: string }[] = [
  { value: "per_person", label: "Theo đầu người" },
  { value: "fixed", label: "Cố định" },
  { value: "per_m3", label: "Theo khối (m³)" },
];

export function BillingConfigForm({ roomId, config }: { roomId: string; config: BillingConfig }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasDualMeter, setHasDualMeter] = useState(config.has_dual_meter);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      const result = await updateBillingConfig(roomId, {
        electricityRate: Number(fd.get("electricityRate")),
        electricityTaxPercent: Number(fd.get("electricityTaxPercent")),
        hasDualMeter,
        dualMeterSurchargePercent: Number(fd.get("dualMeterSurchargePercent")),
        waterCalcType: fd.get("waterCalcType") as WaterCalcType,
        waterRate: Number(fd.get("waterRate")),
        allowTenantMeterInput: fd.get("allowTenantMeterInput") === "on",
      });
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="electricityRate"
        name="electricityRate"
        label="Đơn giá điện (đ/kWh)"
        type="number"
        min={0}
        defaultValue={config.electricity_rate}
        required
      />
      <Input
        id="electricityTaxPercent"
        name="electricityTaxPercent"
        label="Thuế điện (%)"
        type="number"
        min={0}
        step="0.1"
        defaultValue={config.electricity_tax_percent}
      />

      <label className="flex items-center gap-2 text-sm text-neutral-900">
        <input
          type="checkbox"
          checked={hasDualMeter}
          onChange={(e) => setHasDualMeter(e.target.checked)}
          className="rounded border-neutral-200 text-brand-600 focus:ring-brand-500"
        />
        Có 2 đồng hồ điện (trong/ngoài)
      </label>

      {hasDualMeter && (
        <Input
          id="dualMeterSurchargePercent"
          name="dualMeterSurchargePercent"
          label="Phụ thu 2 đồng hồ (%) — chỉ dùng cho mặt bằng, để 0 nếu không áp dụng"
          type="number"
          min={0}
          step="0.1"
          defaultValue={config.dual_meter_surcharge_percent}
        />
      )}

      <div className="space-y-1.5">
        <label htmlFor="waterCalcType" className="text-sm font-medium text-neutral-900">
          Cách tính tiền nước
        </label>
        <select
          id="waterCalcType"
          name="waterCalcType"
          defaultValue={config.water_calc_type}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {WATER_CALC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Input id="waterRate" name="waterRate" label="Đơn giá nước" type="number" min={0} defaultValue={config.water_rate} required />

      <label className="flex items-center gap-2 text-sm text-neutral-900">
        <input
          type="checkbox"
          name="allowTenantMeterInput"
          defaultChecked={config.allow_tenant_meter_input}
          className="rounded border-neutral-200 text-brand-600 focus:ring-brand-500"
        />
        Cho phép tenant tự nhập chỉ số điện/nước
      </label>

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã lưu.</p>}

      <Button type="submit" isLoading={isPending}>
        Lưu
      </Button>
    </form>
  );
}

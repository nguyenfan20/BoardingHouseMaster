"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database, WaterCalcType } from "@/types/database";
import { updateBillingConfig } from "./actions";

type BillingConfig = Database["public"]["Tables"]["billing_config"]["Row"];

interface OtherFeeRow {
  id: string;
  name: string;
  amount: number;
}

const WATER_CALC_OPTIONS: { value: WaterCalcType; label: string }[] = [
  { value: "per_person", label: "Theo đầu người" },
  { value: "fixed", label: "Cố định" },
  { value: "per_m3", label: "Theo khối (m³)" },
];

const QUICK_FEE_SUGGESTIONS = [
  { name: "Tiền rác", amount: 30000 },
  { name: "Wifi / Internet", amount: 50000 },
  { name: "Phí dịch vụ chung", amount: 50000 },
  { name: "Phí gửi xe", amount: 100000 },
];

export function BillingConfigForm({ roomId, config }: { roomId: string; config: BillingConfig }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasDualMeter, setHasDualMeter] = useState(config.has_dual_meter);

  const initialOtherFees: OtherFeeRow[] = Array.isArray(config.other_fees)
    ? (config.other_fees as { name?: string; amount?: number }[]).map((f, i) => ({
        id: `fee-${i}-${Date.now()}`,
        name: f.name ?? "",
        amount: Number(f.amount) || 0,
      }))
    : [];

  const [otherFees, setOtherFees] = useState<OtherFeeRow[]>(initialOtherFees);

  function addFeeRow(name = "", amount = 0) {
    setOtherFees((prev) => [...prev, { id: `fee-${Date.now()}-${Math.random()}`, name, amount }]);
  }

  function removeFeeRow(id: string) {
    setOtherFees((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFeeRow(id: string, field: "name" | "amount", value: string | number) {
    setOtherFees((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: field === "amount" ? Number(value) || 0 : value } : f))
    );
  }

  const totalOtherFees = otherFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

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
        billingDay: Number(fd.get("billingDay")),
        otherFees: otherFees.map(({ name, amount }) => ({ name, amount })),
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Tiền điện ────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">1. Tiền điện</h3>
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
      </div>

      {/* ── Tiền nước ────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">2. Tiền nước</h3>
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
        <Input id="waterRate" name="waterRate" label="Đơn giá nước (đ)" type="number" min={0} defaultValue={config.water_rate} required />
      </div>

      {/* ── Chi phí khác (cố định hàng tháng) ─────────────── */}
      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-neutral-900">3. Chi phí khác (cố định hàng tháng)</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Các khoản phí cố định sẽ được tự động cộng vào hóa đơn mỗi tháng (rác, wifi, dịch vụ,...).
            </p>
          </div>
          <span className="text-sm font-semibold text-brand-700">
            Tổng: {totalOtherFees.toLocaleString("vi-VN")} đ/tháng
          </span>
        </div>

        {/* Gợi ý nhanh */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-neutral-500">Gợi ý thêm nhanh:</span>
          {QUICK_FEE_SUGGESTIONS.map((sug) => {
            const alreadyAdded = otherFees.some((f) => f.name.toLowerCase() === sug.name.toLowerCase());
            return (
              <button
                key={sug.name}
                type="button"
                onClick={() => addFeeRow(sug.name, sug.amount)}
                disabled={alreadyAdded}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  alreadyAdded
                    ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-300"
                }`}
              >
                + {sug.name} ({sug.amount.toLocaleString("vi-VN")} đ)
              </button>
            );
          })}
        </div>

        {/* Danh sách các chi phí khác */}
        {otherFees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4 text-center">
            <p className="text-xs text-neutral-500">Chưa có chi phí khác nào cho phòng này.</p>
            <Button type="button" variant="secondary" onClick={() => addFeeRow()} className="mt-2 text-xs">
              + Thêm chi phí mới
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {otherFees.map((fee, idx) => (
              <div key={fee.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tên chi phí (VD: Tiền rác)"
                  value={fee.name}
                  onChange={(e) => updateFeeRow(fee.id, "name", e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <div className="relative w-36 sm:w-44">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Số tiền (đ)"
                    value={fee.amount === 0 ? "" : fee.amount}
                    onChange={(e) => updateFeeRow(fee.id, "amount", e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-7 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    đ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeeRow(fee.id)}
                  title="Xóa dòng này"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-error-200 hover:bg-error-50 hover:text-error-600 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="pt-1">
              <Button type="button" variant="secondary" onClick={() => addFeeRow()} className="text-xs">
                + Thêm dòng chi phí
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Ngày chốt tiền ────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">4. Ngày chốt tiền / lập hóa đơn</h3>
        <p className="text-xs text-neutral-500">
          Ngày trong tháng mà phòng này được chốt chỉ số và lập hóa đơn (1–28). Trước ngày này, hóa
          đơn mặc định vẫn là kỳ của tháng trước; từ ngày này trở đi, Tổng quan sẽ nhắc tạo hóa đơn
          cho phòng.
        </p>
        <Input
          id="billingDay"
          name="billingDay"
          label="Ngày chốt hằng tháng"
          type="number"
          min={1}
          max={28}
          step={1}
          defaultValue={config.billing_day}
          required
          className="sm:w-40"
        />
      </div>

      {/* ── Cấu hình khác ─────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <label className="flex items-center gap-2 text-sm text-neutral-900 cursor-pointer">
          <input
            type="checkbox"
            name="allowTenantMeterInput"
            defaultChecked={config.allow_tenant_meter_input}
            className="rounded border-neutral-200 text-brand-600 focus:ring-brand-500"
          />
          Cho phép tenant tự nhập chỉ số điện/nước
        </label>
        <p className="mt-1.5 pl-6 text-xs text-neutral-500">
          Tắt thì tenant không thấy trang nhập chỉ số; admin vẫn nhập được ở mục “Chỉ số điện /
          nước” trong trang chi tiết phòng.
        </p>
      </div>

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã lưu cấu hình thành công.</p>}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Lưu cấu hình
      </Button>
    </form>
  );
}

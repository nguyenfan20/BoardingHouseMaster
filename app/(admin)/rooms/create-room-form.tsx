"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RoomType, WaterCalcType } from "@/types";
import { createRoom } from "./actions";

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "normal", label: "Phòng thường (1 đồng hồ)" },
  { value: "dual_meter", label: "Phòng 2 đồng hồ (thuế điện)" },
  { value: "mat_bang", label: "Mặt bằng (2 đồng hồ, phụ thu)" },
];

const WATER_CALC_OPTIONS: { value: WaterCalcType; label: string }[] = [
  { value: "per_person", label: "Theo đầu người" },
  { value: "fixed", label: "Cố định" },
  { value: "per_m3", label: "Theo khối (m³)" },
];

export function CreateRoomForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    setIsPending(true);
    try {
      await createRoom({
        name: String(fd.get("name") ?? ""),
        roomType: fd.get("roomType") as RoomType,
        basePrice: Number(fd.get("basePrice")),
        numOccupants: Number(fd.get("numOccupants") || 1),
        waterCalcType: fd.get("waterCalcType") as WaterCalcType,
        waterRate: Number(fd.get("waterRate")),
      });
      router.refresh();
      onDone();
    } catch {
      setError("Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2">
      <Input id="name" name="name" label="Tên phòng" placeholder="VD: Phòng 101" required />
      <div className="space-y-1.5">
        <label htmlFor="roomType" className="text-sm font-medium text-neutral-900">
          Loại phòng
        </label>
        <select
          id="roomType"
          name="roomType"
          required
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {ROOM_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Input id="basePrice" name="basePrice" label="Giá thuê/tháng (đ)" type="number" min={0} required />
      <Input id="numOccupants" name="numOccupants" label="Số người" type="number" min={1} defaultValue={1} required />
      <div className="space-y-1.5">
        <label htmlFor="waterCalcType" className="text-sm font-medium text-neutral-900">
          Cách tính tiền nước
        </label>
        <select
          id="waterCalcType"
          name="waterCalcType"
          required
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {WATER_CALC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Input
        id="waterRate"
        name="waterRate"
        label="Đơn giá nước (đ/người, đ cố định, hoặc đ/m³)"
        type="number"
        min={0}
        defaultValue={150000}
        required
      />

      {error && <p className="text-sm text-error-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" isLoading={isPending}>
          Tạo phòng
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createParkingRequest } from "./actions";

/** Giá trị mặc định cho <input type="datetime-local">: tròn giờ kế tiếp, theo giờ local. */
function defaultDateTimeValue() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`;
}

export function ParkingRequestForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const form = e.currentTarget;
    const fd = new FormData(form);

    setIsPending(true);
    try {
      const result = await createParkingRequest(
        String(fd.get("plateNumber") ?? ""),
        String(fd.get("scheduledAt") ?? ""),
        String(fd.get("note") ?? "")
      );
      if (!result.success) {
        setError(result.error ?? "Có lỗi xảy ra.");
        return;
      }
      form.reset();
      setSaved(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="plateNumber"
        name="plateNumber"
        label="Biển số xe"
        placeholder="VD: 59H1-234.56"
        autoCapitalize="characters"
        required
      />
      <Input
        id="scheduledAt"
        name="scheduledAt"
        label="Ngày giờ gửi xe"
        type="datetime-local"
        defaultValue={defaultDateTimeValue()}
        required
      />
      <Input id="note" name="note" label="Ghi chú (không bắt buộc)" placeholder="VD: xe máy vision, đi sớm" />

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-brand-700">Đã gửi đăng ký. Xe của bạn sẽ được sắp xếp.</p>}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Đăng ký gửi xe
      </Button>
    </form>
  );
}

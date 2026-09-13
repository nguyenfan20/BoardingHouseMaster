"use client";

import { useTransition } from "react";
import { cancelParkingRequest } from "./actions";

export function CancelParkingButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => void cancelParkingRequest(id))}
      className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-error-50 hover:text-error-600 disabled:opacity-50"
    >
      {isPending ? "Đang hủy..." : "Hủy"}
    </button>
  );
}

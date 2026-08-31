"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { RoomType, WaterCalcType } from "@/types";

export interface CreateRoomInput {
  name: string;
  roomType: RoomType;
  basePrice: number;
  numOccupants: number;
  waterCalcType: WaterCalcType;
  waterRate: number;
}

export async function createRoom(input: CreateRoomInput) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      name: input.name,
      room_type: input.roomType,
      base_price: input.basePrice,
      num_occupants: input.numOccupants,
    })
    .select()
    .single();
  if (error || !room) throw error ?? new Error("Không thể tạo phòng.");

  // Mặc định billing_config theo loại phòng — xem docs/BILLING.md §2 (invariant: chỉ MỘT
  // trong hai electricity_tax_percent / dual_meter_surcharge_percent khác 0).
  const isMatBang = input.roomType === "mat_bang";
  const { error: cfgError } = await supabase.from("billing_config").insert({
    room_id: room.id,
    has_dual_meter: input.roomType !== "normal",
    electricity_tax_percent: isMatBang ? 0 : 4.5,
    dual_meter_surcharge_percent: isMatBang ? 10 : 0,
    water_calc_type: input.waterCalcType,
    water_rate: input.waterRate,
  });
  if (cfgError) throw cfgError;

  revalidatePath("/rooms");
  return room;
}

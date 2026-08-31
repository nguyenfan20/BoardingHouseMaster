import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingConfigForm } from "./billing-config-form";

export const dynamic = "force-dynamic";

export default async function BillingConfigDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase.from("rooms").select("id, name").eq("id", roomId).single();
  if (!room) notFound();

  const { data: config } = await supabase.from("billing_config").select("*").eq("room_id", roomId).single();
  if (!config) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Cấu hình tính tiền — {room.name}</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <BillingConfigForm roomId={roomId} config={config} />
      </div>
    </div>
  );
}

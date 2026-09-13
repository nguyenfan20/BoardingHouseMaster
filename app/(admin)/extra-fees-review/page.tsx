import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvitesIllustration } from "@/components/illustrations";
import { ReviewList } from "./review-list";

export const dynamic = "force-dynamic";

export default async function AdminExtraFeesReviewPage() {
  const supabase = await createClient();

  const { data: fees } = await supabase
    .from("extra_fees")
    .select("*")
    .in("status", ["pending", "declared"])
    .order("created_at", { ascending: true });

  const roomIds = [...new Set((fees ?? []).map((f) => f.room_id))];
  const { data: rooms } = roomIds.length
    ? await supabase.from("rooms").select("id, name").in("id", roomIds)
    : { data: [] };
  const roomNameById = new Map((rooms ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Duyệt phụ phí</h1>
        <p className="mt-1 text-sm text-neutral-600">Phụ phí tenant tự khai báo, chờ admin duyệt trước khi tính vào hóa đơn.</p>
      </div>

      {!fees || fees.length === 0 ? (
        <EmptyState
          illustration={<NoInvitesIllustration />}
          title="Không có phụ phí chờ duyệt"
          description="Mọi phụ phí tenant khai báo sẽ hiện ở đây cho tới khi được duyệt hoặc từ chối."
        />
      ) : (
        <ReviewList fees={fees} roomNameById={Object.fromEntries(roomNameById)} />
      )}
    </div>
  );
}

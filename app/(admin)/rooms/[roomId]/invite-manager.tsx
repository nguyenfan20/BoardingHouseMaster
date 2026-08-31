"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NoInvitesIllustration } from "@/components/illustrations";
import { getInviteStatus } from "@/lib/invites";
import type { Database } from "@/types/database";
import { createRoomInvite, revokeRoomInvite } from "./actions";

type RoomInvite = Database["public"]["Tables"]["room_invites"]["Row"];

const STATUS_LABEL_VI: Record<string, string> = {
  active: "Còn hiệu lực",
  used: "Đã dùng",
  revoked: "Đã thu hồi",
  expired: "Hết hạn",
};

export function InviteManager({ roomId, initialInvites }: { roomId: string; initialInvites: RoomInvite[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setNewLink(null);
    startTransition(async () => {
      const { url } = await createRoomInvite(roomId);
      setNewLink(url);
      setCopied(false);
      setInvites((prev) => [
        {
          id: crypto.randomUUID(),
          room_id: roomId,
          token: "",
          created_by: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          used_at: null,
          used_by: null,
          revoked_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    });
  }

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      await revokeRoomInvite(inviteId, roomId);
      setInvites((prev) =>
        prev.map((inv) => (inv.id === inviteId ? { ...inv, revoked_at: new Date().toISOString() } : inv))
      );
    });
  }

  async function handleCopy() {
    if (!newLink) return;
    await navigator.clipboard.writeText(newLink);
    setCopied(true);
  }

  return (
    <div className="space-y-4">
      <Button type="button" onClick={handleCreate} isLoading={isPending}>
        Tạo link đăng ký
      </Button>

      {newLink && (
        <div className="flex flex-col gap-2 rounded-lg bg-brand-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <code className="break-all text-sm text-brand-900">{newLink}</code>
          <Button type="button" variant="secondary" onClick={handleCopy} className="shrink-0">
            {copied ? "Đã copy" : "Copy link"}
          </Button>
        </div>
      )}

      {invites.length === 0 ? (
        <EmptyState
          illustration={<NoInvitesIllustration />}
          title="Chưa có link nào"
          description="Tạo link đầu tiên để tenant tự đăng ký tài khoản cho phòng này."
        />
      ) : (
        <ul className="space-y-2">
          {invites.map((invite) => {
            const status = getInviteStatus(invite);
            return (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm"
              >
                <div>
                  <Badge status={status}>{STATUS_LABEL_VI[status]}</Badge>
                  <span className="ml-3 text-neutral-600">
                    Tạo lúc {new Date(invite.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                {status === "active" && (
                  <Button type="button" variant="ghost" onClick={() => handleRevoke(invite.id)} disabled={isPending}>
                    Thu hồi
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

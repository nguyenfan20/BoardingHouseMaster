// Helpers thuần cho room_invites — xem docs/SCHEMA.md § room_invites.
import { randomBytes } from "crypto";
import type { InviteStatus } from "@/types";

export const INVITE_EXPIRY_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export interface InviteLike {
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string;
}

export function getInviteStatus(invite: InviteLike, now: Date = new Date()): InviteStatus {
  if (invite.used_at) return "used";
  if (invite.revoked_at) return "revoked";
  if (new Date(invite.expires_at) < now) return "expired";
  return "active";
}

export function buildRegisterUrl(token: string, origin: string): string {
  return `${origin}/register?token=${encodeURIComponent(token)}`;
}

// Style: .claude/skills/ui-design/references/palette.md § Badge status -> color mapping
import { cn } from "@/lib/utils";

type Status = "approved" | "paid" | "pending" | "unpaid" | "rejected" | "active" | "used" | "revoked" | "expired";

const STATUS_STYLES: Record<Status, string> = {
  approved: "bg-brand-50 text-brand-700",
  paid: "bg-brand-50 text-brand-700",
  active: "bg-brand-50 text-brand-700",
  pending: "bg-warning-50 text-warning-600",
  unpaid: "bg-warning-50 text-warning-600",
  used: "bg-neutral-100 text-neutral-600",
  rejected: "bg-error-50 text-error-600",
  revoked: "bg-error-50 text-error-600",
  expired: "bg-neutral-100 text-neutral-600",
};

export function Badge({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {children}
    </span>
  );
}

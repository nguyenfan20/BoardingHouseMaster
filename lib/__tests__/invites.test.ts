import { describe, expect, it } from "vitest";
import { getInviteStatus } from "../invites";

const base = { used_at: null, revoked_at: null, expires_at: "2026-09-07T00:00:00Z" };
const now = new Date("2026-08-31T00:00:00Z");

describe("getInviteStatus", () => {
  it("active khi chưa dùng/thu hồi và chưa hết hạn", () => {
    expect(getInviteStatus(base, now)).toBe("active");
  });

  it("used ưu tiên hơn mọi trạng thái khác", () => {
    expect(getInviteStatus({ ...base, used_at: "2026-08-30T00:00:00Z", revoked_at: "2026-08-30T00:00:00Z" }, now)).toBe(
      "used"
    );
  });

  it("revoked khi đã thu hồi và chưa dùng", () => {
    expect(getInviteStatus({ ...base, revoked_at: "2026-08-30T00:00:00Z" }, now)).toBe("revoked");
  });

  it("expired khi quá hạn và chưa dùng/thu hồi", () => {
    expect(getInviteStatus({ ...base, expires_at: "2026-08-01T00:00:00Z" }, now)).toBe("expired");
  });
});

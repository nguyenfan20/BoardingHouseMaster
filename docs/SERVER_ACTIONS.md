# SERVER_ACTIONS.md — Danh sách Server Actions / API routes

> Ưu tiên Next.js Server Actions cho CRUD (mục 2, PROJECT.md). Chỉ dùng `/app/api` route thật sự
> cần thiết (webhook tương lai, hoặc endpoint cần gọi từ ngoài Next.js). Hiện tại `/app/api` để
> trống, giữ chỗ.

Quy ước: mỗi action tự kiểm tra `role` từ session trước khi thao tác (không chỉ dựa vào RLS —
xem RLS.md § Lưu ý triển khai).

## Admin — Rooms (`app/(admin)/rooms/actions.ts`)
- `createRoom(input)` — tạo room + billing_config mặc định trong 1 transaction.
- `updateRoom(id, input)`
- `deactivateRoom(id)` — set `is_active = false` (không xoá cứng, giữ lịch sử hóa đơn).

## Admin — Room invites (`app/(admin)/rooms/[roomId]/actions.ts`)
- `createRoomInvite(roomId)` — sinh `token` ngẫu nhiên (crypto, đủ entropy để không đoán
  được), insert `room_invites` với `expires_at = now() + 7 ngày`, trả về URL đầy đủ
  `/register?token=...` để admin copy/gửi cho tenant.
- `revokeRoomInvite(inviteId)` — set `revoked_at = now()` (chỉ khi chưa `used_at`).
- `listRoomInvites(roomId)` — danh sách link của phòng kèm trạng thái (xem docs/SCHEMA.md).

## Đăng ký qua link (`app/register/actions.ts`, public — không cần đăng nhập)
- `getInviteByToken(token)` — dùng service-role client, trả về `{ valid, room, reason? }`.
  Đọc trong Server Component của trang `/register` để hiển thị đúng lỗi (hết hạn/đã
  dùng/thu hồi/không tồn tại) trước khi cho vào form.
- `registerWithInvite(token, { email, password, fullName, phone })`:
  1. Re-check điều kiện hợp lệ của token bằng service-role client (chống race condition —
     xem docs/SCHEMA.md § room_invites).
  2. `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
  3. Insert `users` với `role: 'tenant'`, `room_id` từ invite, `full_name`, `phone`.
  4. Update `room_invites.used_at`/`used_by`.
  5. Nếu bước 3-4 lỗi sau khi bước 2 đã tạo auth user — best-effort
     `supabase.auth.admin.deleteUser(...)` để không để lại tài khoản mồ côi, rồi trả lỗi.

## Admin — Billing config (`app/(admin)/billing-config/actions.ts`)
- `updateBillingConfig(roomId, input)` — validate invariant: không cho
  `electricity_tax_percent > 0 && dual_meter_surcharge_percent > 0` cùng lúc (xem BILLING.md §2).

## Admin — Bank info (`app/(admin)/bank-info/actions.ts`)
- `upsertBankInfo(input)`

## Admin — Extra fees duyệt (`app/(admin)/extra-fees-review/actions.ts`)
- `listPendingExtraFees()`
- `reviewExtraFee(id, decision: 'approved' | 'rejected')` — update status/reviewed_by/reviewed_at
  + gọi `createNotification(...)` (xem NOTIFICATIONS.md).
- `createExtraFeeAsAdmin(input)` — tạo thẳng `status = 'approved'`.

## Admin — Meter & invoice
- `upsertMeterReading(roomId, month, input)` — admin nhập/sửa chỉ số.
- `upsertWaterReading(roomId, month, input)` — chỉ khi `water_calc_type = 'per_m3'`.
- `generateInvoice(roomId, month)` — chạy `lib/billing/generate-invoice.ts`, xem BILLING.md §7.
  Sau khi tạo mới (không phải update) → `createNotification` type `invoice_created` cho các user
  của phòng đó.
- `markInvoicePaid(invoiceId)` — set `status = 'paid'` + `createNotification` type `invoice_paid`.

## Tenant — Meter input (`app/(tenant)/meter-input/actions.ts`)
- `submitMeterReading(month, input)` — chỉ chạy nếu
  `billing_config.allow_tenant_meter_input = true` cho phòng của user hiện tại; set `recorded_by = 'tenant'`.
- `submitWaterReading(month, input)` — cùng điều kiện, chỉ khi `water_calc_type = 'per_m3'`.

## Tenant — Extra fees (`app/(tenant)/extra-fees/actions.ts`)
- `declareExtraFee(month, feeName, amount, note?)` — luôn tạo với `status = 'pending'`,
  `created_by = auth.uid()`.
- `listMyExtraFees()` — xem trạng thái các fee mình đã khai (pending/approved/rejected).

## Tenant — Invoices (`app/(tenant)/invoices/actions.ts`)
- `listMyInvoices()`
- `getInvoiceDetail(id)` — kèm `qr_url` để hiển thị QR.

## Notifications (dùng chung, `app/notifications/actions.ts`)
- `listMyNotifications()`
- `markNotificationRead(id)`

## Auth (`app/login/actions.ts`)
- `signInWithPassword(email, password)` — Supabase Auth, redirect theo role sau khi đăng nhập
  (`admin` → `/dashboard`, `tenant` → `/invoices`).
- `signOut()`

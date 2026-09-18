# SCHEMA.md — Database Schema (Supabase/Postgres)

> Nguồn sự thật cho schema. Mọi migration trong `/supabase/migrations` phải khớp file này.
> Cập nhật file này TRƯỚC khi viết migration mới — không để hai nơi lệch nhau.
> Đây là bản mở rộng của mục 4, PROJECT.md, sau vòng Q&A ngày 2026-08-31 (xem "Quyết định" cuối file).

## Bảng: `users`

Map 1-1 với `auth.users` của Supabase Auth.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | = auth.users.id |
| role | text | `'admin' \| 'tenant'` |
| room_id | uuid FK → rooms.id, nullable | **Không unique** — nhiều tenant có thể cùng `room_id` (xem Quyết định #2) |
| full_name | text | |
| phone | text | |
| created_at | timestamptz | default now() |

## Bảng: `rooms`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| name | text | VD "Phòng 101", "Mặt bằng" |
| room_type | text | `'normal' \| 'dual_meter' \| 'mat_bang'` |
| base_price | numeric | giá thuê/tháng |
| num_occupants | int | mặc định 1, dùng để tính nước `per_person` |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

## Bảng: `billing_config` (1-1 với `rooms`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| room_id | uuid PK, FK → rooms.id on delete cascade | |
| electricity_rate | numeric | default 3500 (VNĐ/kWh) |
| electricity_tax_percent | numeric | default 4.5, = 0 nếu là mặt bằng có phụ thu 2 đồng hồ |
| has_dual_meter | boolean | default false |
| dual_meter_surcharge_percent | numeric | default 0; 10 cho mặt bằng, 0 cho phòng thường |
| water_calc_type | text | `'per_person' \| 'fixed' \| 'per_m3'` |
| water_rate | numeric | ý nghĩa phụ thuộc water_calc_type |
| **allow_tenant_meter_input** | **boolean** | **default false — cờ per-room, bật thì tenant được tự nhập `meter_readings`/`water_readings` của phòng mình (xem Quyết định #3)** |
| other_fees | jsonb | default `'[]'` — chi phí cố định hằng tháng `[{name, amount}]` |
| **billing_day** | **int** | **default 1, check 1..28 — ngày chốt số/lập hóa đơn của riêng phòng này (Quyết định #7)** |
| updated_at | timestamptz | default now() |

> Ràng buộc nghiệp vụ (không phải constraint DB, enforce ở `/lib/billing`): chỉ MỘT trong hai
> `electricity_tax_percent` / `dual_meter_surcharge_percent` khác 0 tại một thời điểm cho mỗi phòng.

## Bảng: `meter_readings`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id on delete cascade | |
| month | date | ngày đầu tháng, VD 2026-09-01 |
| meter_type | text | `'single' \| 'indoor' \| 'outdoor'` |
| old_index | numeric | |
| new_index | numeric | |
| recorded_by | text | `'admin' \| 'tenant'` |
| created_at | timestamptz | |
| | | UNIQUE (room_id, month, meter_type) |

## Bảng: `water_readings`

Chỉ dùng khi `water_calc_type = 'per_m3'`.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id on delete cascade | |
| month | date | |
| old_index | numeric | |
| new_index | numeric | |
| created_at | timestamptz | |
| | | UNIQUE (room_id, month) |

## Bảng: `extra_fees`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id on delete cascade | |
| month | date | |
| fee_name | text | |
| amount | numeric | |
| note | text | nullable |
| **status** | **text** | **`'pending' \| 'approved' \| 'rejected'`, default `'pending'` (Quyết định #1)** |
| **created_by** | **uuid FK → auth.users.id** | **ai khai báo (admin hoặc tenant)** |
| **reviewed_by** | **uuid FK → auth.users.id, nullable** | **admin đã duyệt/từ chối** |
| **reviewed_at** | **timestamptz, nullable** | |
| created_at | timestamptz | |

> Khi admin tự tạo extra_fee (không phải tenant khai), tạo thẳng với `status = 'approved'`,
> `reviewed_by = created_by`, `reviewed_at = now()` — không cần tự duyệt chính mình.
> Chỉ extra_fees có `status = 'approved'` mới được cộng vào `invoices.breakdown` khi generate hóa đơn.

## Bảng: `invoices`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id on delete cascade | |
| month | date | |
| breakdown | jsonb | snapshot chi tiết (xem BILLING.md) |
| total_amount | numeric | |
| qr_url | text | |
| status | text | `'unpaid' \| 'paid'`, default `'unpaid'` |
| created_at | timestamptz | |
| | | UNIQUE (room_id, month) |

> Generate lại hóa đơn cho tháng đã tồn tại → **upsert** theo `(room_id, month)`, ghi đè
> `breakdown`/`total_amount`/`qr_url`, trừ khi `status = 'paid'` thì chặn ghi đè và trả lỗi
> (Quyết định #4). Xem chi tiết ở SERVER_ACTIONS.md.

## Bảng: `bank_info`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| bank_code | text | mã theo chuẩn VietQR |
| account_no | text | |
| account_name | text | |
| is_active | boolean | default true |

## Bảng: `room_invites` (mới — đăng ký tài khoản tenant qua link)

Admin tạo link đăng ký cho một phòng cụ thể tại trang chi tiết phòng; tenant mở link, tự
đặt email/mật khẩu, hệ thống tạo tài khoản `auth.users` + `users` (role='tenant',
`room_id` = phòng đó) và đánh dấu link đã dùng.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| room_id | uuid FK → rooms.id on delete cascade | |
| token | text | random, unique, dùng trong URL `/register?token=...` |
| created_by | uuid FK → auth.users.id | admin đã tạo link |
| expires_at | timestamptz | mặc định `now() + interval '7 days'` |
| used_at | timestamptz, nullable | set khi đăng ký thành công |
| used_by | uuid FK → auth.users.id, nullable | user vừa được tạo |
| revoked_at | timestamptz, nullable | set khi admin bấm "thu hồi" link trước khi dùng |
| created_at | timestamptz | |

Trạng thái link (tính, không lưu cột riêng — suy ra khi hiển thị):
`used_at != null` → "đã dùng" · `revoked_at != null` → "đã thu hồi" ·
`expires_at < now()` → "hết hạn" · còn lại → "còn hiệu lực".

> Link **dùng 1 lần**: `registerWithInvite` phải kiểm tra `used_at is null and revoked_at is
> null and expires_at > now()` trước khi tạo tài khoản, trong cùng transaction/thao tác với
> việc set `used_at`/`used_by`, để tránh race condition dùng link 2 lần cùng lúc.

## Bảng: `parking_requests` (mới — Quyết định #8)

Tenant đăng ký gửi xe: biển số + thời điểm, để admin biết trước mà sắp xếp chỗ. Hiển thị ở
dashboard admin (mục "Đăng ký gửi xe sắp tới").

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| room_id | uuid FK → rooms.id on delete cascade | |
| created_by | uuid FK → auth.users.id on delete set null | tenant đã đăng ký |
| plate_number | text | biển số, lưu dạng UPPERCASE đã trim |
| scheduled_at | timestamptz | thời điểm gửi xe |
| note | text, nullable | VD "xe máy 110cc, gửi qua đêm" |
| created_at | timestamptz | default now() |

> Không có cột `status`/duyệt — đây chỉ là thông báo trước cho admin, không phải luồng phê
> duyệt. Tenant xoá được đăng ký của chính mình (hủy), admin xoá được mọi đăng ký.
>
> **Lưu trữ 30 ngày**: dashboard admin chỉ hiện đăng ký `scheduled_at >= now()`; đăng ký đã qua
> giờ hẹn nằm ở trang `(admin)/parking-requests`, và dòng có `scheduled_at < now() - 30 ngày` bị
> xoá. Việc xoá chạy lazy mỗi lần admin mở trang đó (không dùng pg_cron — xem comment
> `ponytail:` trong `app/(admin)/parking-requests/page.tsx`), nên bảng không phình vô hạn mà
> cũng không cần hạ tầng job chạy nền.

## Bảng: `notifications` (mới — Quyết định #1)

Thông báo cho tenant/admin khi extra_fee được duyệt/từ chối, hóa đơn mới, v.v. Xem NOTIFICATIONS.md.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users.id on delete cascade | người nhận |
| type | text | `'extra_fee_approved' \| 'extra_fee_rejected' \| 'invoice_created' \| 'invoice_paid' \| 'general'` |
| title | text | |
| body | text | nullable |
| related_table | text | nullable, VD `'extra_fees'`, `'invoices'` |
| related_id | uuid | nullable |
| is_read | boolean | default false |
| created_at | timestamptz | default now() |

---

## Quyết định từ Q&A (2026-08-31)

1. **extra_fees cần duyệt**: tenant khai báo → `status='pending'`, admin duyệt/từ chối ở trang
   `(admin)/extra-fees`, sau đó hệ thống tạo `notifications` báo cho tenant kết quả.
2. **Nhiều tenant/phòng**: `users.room_id` không unique, nhiều user cùng room_id đều xem được
   hóa đơn/nhập chỉ số của phòng đó.
3. **Quyền nhập chỉ số**: thêm `billing_config.allow_tenant_meter_input` (per-room), thay vì hard-code
   toàn hệ thống.
4. **Regenerate invoice**: upsert theo `(room_id, month)` nếu `status != 'paid'`; chặn nếu đã `paid`.

## Quyết định từ Q&A (2026-08-31, vòng 2 — đăng ký tài khoản tenant)

5. **Link đăng ký dùng 1 lần, hết hạn 7 ngày**: mỗi link chỉ tạo được đúng 1 tài khoản, admin
   tạo link mới nếu phòng cần thêm tenant (xem [CONTEXT.md](../CONTEXT.md) entry tương ứng).
6. **Tenant tự đặt mật khẩu** khi đăng ký qua link — admin không cần biết/truyền mật khẩu.

## Quyết định từ Q&A (2026-09-13, vòng 3 — ngày chốt tiền + gửi xe)

7. **Ngày chốt tiền theo từng phòng**: `billing_config.billing_day` (1..28, giới hạn 28 để
   tháng 2 cũng luôn có ngày đó). Không có bảng lịch riêng — kỳ hóa đơn suy ra bằng pure
   function `billingMonthFor(billingDay, today)` trong `lib/billing/billing-cycle.ts`.
8. **`parking_requests` không có bước duyệt**: tenant đăng ký → admin thấy ngay ở dashboard +
   nhận `notifications` type `general`. Không thêm type notification mới để khỏi phải đổi
   check constraint của `notifications.type`.

## Quyết định từ Q&A (2026-09-18, vòng 4 — hồ sơ tenant)

9. **Tenant tự sửa `full_name`/`phone`, không thêm cột mới**: trang `/profile` chỉ cho sửa hai
   field đã có sẵn trong `users` — không thêm CMND/địa chỉ/email vì chưa có yêu cầu cụ thể
   (YAGNI). Email vẫn chỉ sửa được qua `auth.users` (ngoài phạm vi bảng này) nếu sau này cần.
   RLS: migration `0007_users_tenant_self_update.sql` thêm policy cho tenant UPDATE dòng của
   chính mình (xem docs/RLS.md § users).

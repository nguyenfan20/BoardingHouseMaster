# NOTIFICATIONS.md — Thông báo trong hệ thống

> Bổ sung theo Quyết định #1 (SCHEMA.md): khi admin duyệt/từ chối `extra_fees` do tenant khai báo,
> hệ thống tạo một bản ghi `notifications` cho tenant đó.

## Khi nào tạo notification

| Sự kiện | user_id nhận | type | title mẫu |
|---|---|---|---|
| Admin duyệt extra_fee | `extra_fees.created_by` | `extra_fee_approved` | "Phụ phí '<fee_name>' đã được duyệt" |
| Admin từ chối extra_fee | `extra_fees.created_by` | `extra_fee_rejected` | "Phụ phí '<fee_name>' bị từ chối" |
| Hóa đơn tháng mới được tạo | mọi user có `room_id` = phòng đó | `invoice_created` | "Hóa đơn tháng <month> đã sẵn sàng" |
| Admin đánh dấu hóa đơn đã thanh toán | mọi user có `room_id` = phòng đó | `invoice_paid` | "Hóa đơn tháng <month> đã thanh toán" |
| Tenant khai báo extra_fee | mọi user `role = 'admin'` | `general` | "Phụ phí mới từ <room>" |
| Tenant đăng ký gửi xe | mọi user `role = 'admin'` | `general` | "Đăng ký gửi xe — <room> (<biển số>)" |

## Nơi tạo

Tạo trong cùng Server Action với hành động gốc (duyệt fee / generate invoice / mark paid), dùng
service-role client — KHÔNG tạo qua trigger DB ở giai đoạn MVP này (đơn giản hoá, dễ debug; có thể
chuyển sang `pg trigger` sau nếu cần bắn từ nhiều nguồn).

Helper dùng chung: `lib/notifications.ts` → `createNotification({ userId, type, title, body?, relatedTable?, relatedId? })`.

## Hiển thị

- Badge số lượng `is_read = false` ở header (admin + tenant layout).
- Trang danh sách thông báo, click vào → set `is_read = true` + điều hướng tới `related_table`/`related_id`
  tương ứng (VD extra_fee → trang extra-fees của tenant; invoice → trang invoices).

## Ngoài phạm vi MVP (không làm ở giai đoạn này)

- Push notification / email — chỉ lưu trong bảng `notifications`, hiển thị trong app khi tenant đăng nhập.
- Realtime (Supabase Realtime subscription) — có thể thêm sau, MVP chỉ cần fetch khi load trang.

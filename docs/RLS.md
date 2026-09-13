# RLS.md — Row Level Security Policies (Supabase)

> Enforce phân quyền ở tầng database (mục 3, PROJECT.md), không chỉ ở UI/server action.
> Mọi bảng có dữ liệu theo phòng đều BẬT RLS. Migration tương ứng: `supabase/migrations/0001_init.sql`.

## Helper functions (SQL, dùng trong policies)

```sql
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

create or replace function my_room_id() returns uuid as $$
  select room_id from users where id = auth.uid();
$$ language sql stable security definer;
```

`security definer` để tránh đệ quy RLS khi policy trên `users` tự query lại `users`.

## `users`

- SELECT: admin xem tất cả; tenant chỉ xem chính mình (`id = auth.uid()`).
- INSERT/UPDATE/DELETE: chỉ admin (tenant không tự đổi role/room_id của mình).

## `rooms`

- SELECT: admin xem tất cả; tenant chỉ xem phòng mình (`id = my_room_id()`).
- INSERT/UPDATE/DELETE: chỉ admin.

## `billing_config`

- SELECT: admin xem tất cả; tenant xem của phòng mình (cần để biết `allow_tenant_meter_input`,
  `water_calc_type`... hiển thị UI nhập liệu đúng).
- INSERT/UPDATE/DELETE: chỉ admin.

## `meter_readings`

- SELECT: admin tất cả; tenant chỉ của phòng mình.
- INSERT: admin luôn được; tenant chỉ được nếu `room_id = my_room_id()` **và**
  `billing_config.allow_tenant_meter_input = true` cho phòng đó (subquery trong policy).
- UPDATE/DELETE: chỉ admin (tenant không tự sửa/xoá số đã nhập, tránh gian lận — chỉ tạo mới; sửa sai phải nhờ admin).

## `water_readings`

- Giống hệt `meter_readings` (cùng điều kiện `allow_tenant_meter_input`).

## `extra_fees`

- SELECT: admin tất cả; tenant chỉ của phòng mình.
- INSERT: admin luôn được (tạo với status tự chọn); tenant chỉ được tạo với
  `room_id = my_room_id()`, `created_by = auth.uid()` **và** `status in ('declared', 'pending')`
  (không tự set approved) — enforce bằng `with check` trong policy (cập nhật ở migration 0004).
- UPDATE: chỉ admin (duyệt/từ chối = update status/reviewed_by/reviewed_at). Tenant không được
  sửa fee đã tạo (muốn sửa thì tạo dòng mới, tránh sửa sau khi admin đã duyệt).
- DELETE: chỉ admin.

## `invoices`

- SELECT: admin tất cả; tenant chỉ của phòng mình.
- INSERT/UPDATE/DELETE: chỉ admin (kể cả đổi `status = 'paid'`).

## `bank_info`

- SELECT: mọi user đã đăng nhập (tenant cần thấy để build QR hiển thị lại nếu cần, dù thường QR
  đã build sẵn trong `invoices.qr_url`).
- INSERT/UPDATE/DELETE: chỉ admin.

## `room_invites`

- SELECT/INSERT/UPDATE/DELETE: chỉ admin qua session thường (trang quản lý link ở admin).
- **Không có policy cho anon/tenant** — trang `/register` (chưa đăng nhập) không đọc bảng
  này qua client RLS. Việc kiểm tra token hợp lệ và tạo tài khoản chạy hoàn toàn trong
  Server Action bằng `service_role` client (bypass RLS), vì bản thân hành động "kiểm tra +
  tạo user + đánh dấu đã dùng" phải atomic và không thể expose qua client thường.

## `parking_requests`

- SELECT: admin tất cả; tenant chỉ của phòng mình (`room_id = my_room_id()`).
- INSERT: admin luôn được; tenant chỉ với `room_id = my_room_id()` **và** `created_by = auth.uid()`.
- UPDATE: chỉ admin.
- DELETE: admin tất cả; tenant chỉ dòng của phòng mình do chính mình tạo (nút "Hủy" ở trang Gửi xe).

## `notifications`

- SELECT: user chỉ xem thông báo của chính mình (`user_id = auth.uid()`).
- UPDATE: user chỉ được tự đánh dấu `is_read = true` cho thông báo của mình (không sửa field khác).
- INSERT: chỉ server (Server Actions dùng `service_role` client, bypass RLS) — không cho client
  insert trực tiếp.
- DELETE: không cho phép qua client.

## Lưu ý triển khai

- Tất cả Server Actions chạy nghiệp vụ nhạy cảm (generate invoice, duyệt extra_fee, tạo
  notification) dùng Supabase client khởi tạo với `SUPABASE_SERVICE_ROLE_KEY` ở server
  (`lib/supabase/server.ts`), sau khi tự kiểm tra `role` từ session — không dựa hoàn toàn vào RLS
  cho các thao tác nhiều bảng cùng lúc (RLS là lớp phòng thủ thứ hai, không phải duy nhất).
- Client-side Supabase (`lib/supabase/client.ts`) luôn dùng `anon key`, không bao giờ dùng
  service role key ở client.

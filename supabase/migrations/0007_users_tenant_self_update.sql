-- Tenant tự sửa hồ sơ (họ tên, SĐT) ở trang /profile — chỉ mở UPDATE cho chính dòng của mình.
-- Server Action `updateMyProfile` chỉ được viết full_name/phone (không đụng role/room_id);
-- RLS là lớp phòng thủ thứ hai, giống cách notifications_update đã làm (xem docs/RLS.md).
create policy users_self_update on users for update
  using (id = auth.uid()) with check (id = auth.uid());

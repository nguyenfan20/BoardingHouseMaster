-- Migration: Thêm chi phí khác vào billing_config và sửa policy RLS cho extra_fees.

-- 1. Thêm cột other_fees vào billing_config (danh sách json các chi phí cố định: [{name: string, amount: number}])
alter table billing_config
  add column if not exists other_fees jsonb not null default '[]'::jsonb;

-- 2. Cập nhật RLS policy extra_fees_insert cho phép status 'declared' hoặc 'pending'
drop policy if exists extra_fees_insert on extra_fees;
create policy extra_fees_insert on extra_fees for insert
  with check (
    is_admin()
    or (room_id = my_room_id() and status in ('declared', 'pending') and created_by = auth.uid())
  );

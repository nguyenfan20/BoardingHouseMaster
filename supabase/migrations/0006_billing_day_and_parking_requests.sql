-- Migration: (1) ngày chốt tiền/lập hóa đơn riêng cho từng phòng,
--            (2) bảng parking_requests — tenant đăng ký gửi xe theo ngày giờ.

-- ── 1. billing_config.billing_day ────────────────────────────────────────
-- Ngày trong tháng mà phòng này được chốt số & lập hóa đơn (1..28 để tháng nào cũng có).
alter table billing_config
  add column if not exists billing_day int not null default 1;

alter table billing_config drop constraint if exists billing_config_billing_day_check;
alter table billing_config
  add constraint billing_config_billing_day_check check (billing_day between 1 and 28);

-- ── 2. parking_requests ──────────────────────────────────────────────────
create table if not exists parking_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  plate_number text not null,
  scheduled_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_parking_requests_scheduled_at on parking_requests(scheduled_at);
create index if not exists idx_parking_requests_room on parking_requests(room_id);

alter table parking_requests enable row level security;

drop policy if exists parking_requests_select on parking_requests;
create policy parking_requests_select on parking_requests for select
  using (is_admin() or room_id = my_room_id());

drop policy if exists parking_requests_insert on parking_requests;
create policy parking_requests_insert on parking_requests for insert
  with check (is_admin() or (room_id = my_room_id() and created_by = auth.uid()));

drop policy if exists parking_requests_update on parking_requests;
create policy parking_requests_update on parking_requests for update
  using (is_admin()) with check (is_admin());

drop policy if exists parking_requests_delete on parking_requests;
create policy parking_requests_delete on parking_requests for delete
  using (is_admin() or (room_id = my_room_id() and created_by = auth.uid()));

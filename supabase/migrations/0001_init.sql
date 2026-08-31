-- 0001_init.sql
-- Nguồn: docs/SCHEMA.md. Sửa docs/SCHEMA.md trước, rồi thêm migration mới (không sửa file này
-- sau khi đã áp dụng lên môi trường nào đó — tạo migration mới nối tiếp, VD 0002_*.sql).

create extension if not exists "pgcrypto";

-- ── rooms ────────────────────────────────────────────────────────────────
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_type text not null check (room_type in ('normal', 'dual_meter', 'mat_bang')),
  base_price numeric not null,
  num_occupants int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── users (map với auth.users) ──────────────────────────────────────────
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'tenant')),
  room_id uuid references rooms(id),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- ── billing_config (1-1 với rooms) ──────────────────────────────────────
create table billing_config (
  room_id uuid primary key references rooms(id) on delete cascade,
  electricity_rate numeric not null default 3500,
  electricity_tax_percent numeric not null default 4.5,
  has_dual_meter boolean not null default false,
  dual_meter_surcharge_percent numeric not null default 0,
  water_calc_type text not null check (water_calc_type in ('per_person', 'fixed', 'per_m3')),
  water_rate numeric not null,
  allow_tenant_meter_input boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint chk_tax_or_surcharge_not_both
    check (not (electricity_tax_percent > 0 and dual_meter_surcharge_percent > 0))
);

-- ── meter_readings ───────────────────────────────────────────────────────
create table meter_readings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  month date not null,
  meter_type text not null check (meter_type in ('single', 'indoor', 'outdoor')),
  old_index numeric not null,
  new_index numeric not null,
  recorded_by text not null check (recorded_by in ('admin', 'tenant')),
  created_at timestamptz not null default now(),
  unique (room_id, month, meter_type)
);

-- ── water_readings ───────────────────────────────────────────────────────
create table water_readings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  month date not null,
  old_index numeric not null,
  new_index numeric not null,
  created_at timestamptz not null default now(),
  unique (room_id, month)
);

-- ── extra_fees ───────────────────────────────────────────────────────────
create table extra_fees (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  month date not null,
  fee_name text not null,
  amount numeric not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── invoices ─────────────────────────────────────────────────────────────
create table invoices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  month date not null,
  breakdown jsonb not null,
  total_amount numeric not null,
  qr_url text,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamptz not null default now(),
  unique (room_id, month)
);

-- ── bank_info ────────────────────────────────────────────────────────────
create table bank_info (
  id uuid primary key default gen_random_uuid(),
  bank_code text not null,
  account_no text not null,
  account_name text not null,
  is_active boolean not null default true
);

-- ── notifications ────────────────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in
    ('extra_fee_approved', 'extra_fee_rejected', 'invoice_created', 'invoice_paid', 'general')),
  title text not null,
  body text,
  related_table text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_meter_readings_room_month on meter_readings(room_id, month);
create index idx_water_readings_room_month on water_readings(room_id, month);
create index idx_extra_fees_room_month on extra_fees(room_id, month);
create index idx_extra_fees_status on extra_fees(status);
create index idx_invoices_room_month on invoices(room_id, month);
create index idx_notifications_user_unread on notifications(user_id, is_read);

-- ── RLS: enable ──────────────────────────────────────────────────────────
alter table users enable row level security;
alter table rooms enable row level security;
alter table billing_config enable row level security;
alter table meter_readings enable row level security;
alter table water_readings enable row level security;
alter table extra_fees enable row level security;
alter table invoices enable row level security;
alter table bank_info enable row level security;
alter table notifications enable row level security;

-- ── RLS: helper functions ───────────────────────────────────────────────
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

create or replace function my_room_id() returns uuid as $$
  select room_id from users where id = auth.uid();
$$ language sql stable security definer;

create or replace function room_allows_tenant_input(p_room_id uuid) returns boolean as $$
  select coalesce(
    (select allow_tenant_meter_input from billing_config where room_id = p_room_id),
    false
  );
$$ language sql stable security definer;

-- ── RLS: users ───────────────────────────────────────────────────────────
create policy users_select on users for select
  using (is_admin() or id = auth.uid());
create policy users_write on users for all
  using (is_admin()) with check (is_admin());

-- ── RLS: rooms ───────────────────────────────────────────────────────────
create policy rooms_select on rooms for select
  using (is_admin() or id = my_room_id());
create policy rooms_write on rooms for all
  using (is_admin()) with check (is_admin());

-- ── RLS: billing_config ─────────────────────────────────────────────────
create policy billing_config_select on billing_config for select
  using (is_admin() or room_id = my_room_id());
create policy billing_config_write on billing_config for all
  using (is_admin()) with check (is_admin());

-- ── RLS: meter_readings ──────────────────────────────────────────────────
create policy meter_readings_select on meter_readings for select
  using (is_admin() or room_id = my_room_id());
create policy meter_readings_insert on meter_readings for insert
  with check (
    is_admin()
    or (room_id = my_room_id() and room_allows_tenant_input(room_id) and recorded_by = 'tenant')
  );
create policy meter_readings_update on meter_readings for update
  using (is_admin()) with check (is_admin());
create policy meter_readings_delete on meter_readings for delete
  using (is_admin());

-- ── RLS: water_readings ──────────────────────────────────────────────────
create policy water_readings_select on water_readings for select
  using (is_admin() or room_id = my_room_id());
create policy water_readings_insert on water_readings for insert
  with check (
    is_admin()
    or (room_id = my_room_id() and room_allows_tenant_input(room_id))
  );
create policy water_readings_update on water_readings for update
  using (is_admin()) with check (is_admin());
create policy water_readings_delete on water_readings for delete
  using (is_admin());

-- ── RLS: extra_fees ──────────────────────────────────────────────────────
create policy extra_fees_select on extra_fees for select
  using (is_admin() or room_id = my_room_id());
create policy extra_fees_insert on extra_fees for insert
  with check (
    is_admin()
    or (room_id = my_room_id() and status = 'pending' and created_by = auth.uid())
  );
create policy extra_fees_update on extra_fees for update
  using (is_admin()) with check (is_admin());
create policy extra_fees_delete on extra_fees for delete
  using (is_admin());

-- ── RLS: invoices ────────────────────────────────────────────────────────
create policy invoices_select on invoices for select
  using (is_admin() or room_id = my_room_id());
create policy invoices_write on invoices for all
  using (is_admin()) with check (is_admin());

-- ── RLS: bank_info ───────────────────────────────────────────────────────
create policy bank_info_select on bank_info for select
  using (auth.uid() is not null);
create policy bank_info_write on bank_info for all
  using (is_admin()) with check (is_admin());

-- ── RLS: notifications ───────────────────────────────────────────────────
create policy notifications_select on notifications for select
  using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- INSERT/DELETE: chỉ service_role (server actions), không có policy cho client => mặc định chặn.

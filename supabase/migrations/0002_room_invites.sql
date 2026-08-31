-- 0002_room_invites.sql
-- Nguồn: docs/SCHEMA.md § room_invites. Link đăng ký tài khoản tenant, dùng 1 lần, hết hạn 7 ngày.

create table room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  token text not null unique,
  created_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_room_invites_room on room_invites(room_id);
create index idx_room_invites_token on room_invites(token);

alter table room_invites enable row level security;

-- Chỉ admin thao tác qua session thường. Trang /register (chưa đăng nhập) không đọc bảng
-- này qua client RLS — Server Action dùng service_role client, bypass RLS hoàn toàn.
create policy room_invites_admin_only on room_invites for all
  using (is_admin()) with check (is_admin());

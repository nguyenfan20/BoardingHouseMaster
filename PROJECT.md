# PROJECT.md — Hệ thống Quản lý Nhà trọ

> File này là đặc tả kỹ thuật cho dự án. Đọc kỹ toàn bộ trước khi bắt đầu code.
> Mục tiêu: xây dựng đầy đủ, đúng logic tính tiền, tối ưu chi phí (free tier), có CI/CD.

## 1. Tổng quan

Web nội bộ quản lý nhà trọ với 2 vai trò: **admin** (chủ trọ) và **tenant** (người thuê phòng).
Chức năng cốt lõi: quản lý phòng, ghi chỉ số điện/nước, tự động tính hóa đơn hàng tháng theo
cấu hình linh hoạt từng phòng, sinh mã QR chuyển khoản.

## 2. Tech stack

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend/Backend | Next.js 14 (App Router) | Server Actions cho CRUD, hạn chế viết API route riêng trừ khi cần webhook/QR |
| UI | Tailwind CSS + shadcn/ui | Ưu tiên component có sẵn, tối giản code UI tự viết |
| Database + Auth | Supabase (Postgres) | Free tier. Dùng Supabase Auth, bật Row Level Security (RLS) |
| QR chuyển khoản | VietQR API | `https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.png?amount=...&addInfo=...` — không cần backend riêng |
| Deploy | Vercel (Hobby) | Free domain `*.vercel.app` |
| CI/CD | GitHub Actions + Vercel Git Integration | Xem mục 7 |
| Ngôn ngữ | TypeScript | Bắt buộc, không dùng JS thuần |

## 3. Vai trò & phân quyền

- **admin**: toàn quyền CRUD phòng, cấu hình tính tiền, phí, thông tin ngân hàng, xem/sửa mọi hóa đơn.
- **tenant**: chỉ xem/thao tác trên phòng mình được gán (`room_id` trong bảng `users`).
  - Có thể tự điền chỉ số điện tháng này (nếu admin cho phép) hoặc admin điền sẵn.
  - Có thể khai báo phụ phí phát sinh trong tháng (chờ admin duyệt hoặc tự cộng thẳng — xem mục 6).
  - Xem hóa đơn kèm mã QR.
- Dùng Supabase RLS để enforce phân quyền ở tầng database, không chỉ ở tầng UI.

## 4. Database schema (Supabase/Postgres)

```sql
-- Người dùng, map với Supabase Auth (auth.users)
create table users (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('admin', 'tenant')),
  room_id uuid references rooms(id),
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- Phòng / mặt bằng
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- VD: "Phòng 101", "Mặt bằng"
  room_type text not null check (room_type in ('normal', 'dual_meter', 'mat_bang')),
  base_price numeric not null,      -- giá thuê phòng/tháng
  num_occupants int not null default 1,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Cấu hình tính tiền — 1-1 với rooms, admin CRUD được qua UI (KHÔNG hard-code trong app)
create table billing_config (
  room_id uuid primary key references rooms(id) on delete cascade,
  electricity_rate numeric not null default 3500,       -- VNĐ/kWh
  electricity_tax_percent numeric not null default 4.5, -- % thuế điện, 0 nếu là mặt bằng
  has_dual_meter boolean not null default false,
  dual_meter_surcharge_percent numeric not null default 0, -- 10 cho mặt bằng, 0 cho phòng thường
  water_calc_type text not null check (water_calc_type in ('per_person', 'fixed', 'per_m3')),
  water_rate numeric not null,      -- 150000 (per_person) / số tiền cố định (fixed) / 25000 (per_m3)
  updated_at timestamptz default now()
);

-- Chỉ số điện từng tháng
create table meter_readings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month date not null,              -- lưu ngày đầu tháng, VD 2026-09-01
  meter_type text not null check (meter_type in ('single', 'indoor', 'outdoor')),
  old_index numeric not null,
  new_index numeric not null,
  recorded_by text not null check (recorded_by in ('admin', 'tenant')),
  created_at timestamptz default now(),
  unique (room_id, month, meter_type)
);

-- Chỉ số nước (nếu water_calc_type = 'per_m3', ví dụ mặt bằng)
create table water_readings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month date not null,
  old_index numeric not null,
  new_index numeric not null,
  created_at timestamptz default now(),
  unique (room_id, month)
);

-- Phụ phí phát sinh theo tháng (wifi, thêm người, v.v.)
create table extra_fees (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month date not null,
  fee_name text not null,
  amount numeric not null,
  note text,
  created_at timestamptz default now()
);

-- Hóa đơn hoàn chỉnh từng tháng
create table invoices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  month date not null,
  breakdown jsonb not null,   -- snapshot chi tiết: tiền phòng, điện, nước, thuế, surcharge, phụ phí
  total_amount numeric not null,
  qr_url text,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamptz default now(),
  unique (room_id, month)
);

-- Thông tin tài khoản ngân hàng để build QR
create table bank_info (
  id uuid primary key default gen_random_uuid(),
  bank_code text not null,      -- mã ngân hàng theo chuẩn VietQR (VD: 970436 cho Vietcombank)
  account_no text not null,
  account_name text not null,
  is_active boolean default true
);
```

## 5. Công thức tính tiền — QUAN TRỌNG, PHẢI ĐÚNG TUYỆT ĐỐI

### 5.1. Điện — phòng thường (1 đồng hồ)

```
Số điện tiêu thụ = Chỉ số mới - Chỉ số cũ
Tiền điện        = Số điện tiêu thụ * electricity_rate (mặc định 3,500)
Thuế điện        = Tiền điện * electricity_tax_percent (mặc định 4.5%)
Tổng tiền điện   = Tiền điện + Thuế điện
```

### 5.2. Điện — phòng/mặt bằng có 2 đồng hồ (`has_dual_meter = true`)

```
Số điện đồng hồ trong = new_index_indoor - old_index_indoor
Số điện đồng hồ ngoài  = new_index_outdoor - old_index_outdoor
Tổng số điện           = Số điện trong + Số điện ngoài
Tiền điện gốc          = Tổng số điện * electricity_rate

Nếu là mặt bằng (electricity_tax_percent = 0, dual_meter_surcharge_percent = 10):
  Phụ thu = Tiền điện gốc * 10%
  Tổng tiền điện = Tiền điện gốc + Phụ thu
  (KHÔNG áp dụng thuế điện 4.5% cho mặt bằng)

Nếu là phòng thường có 2 đồng hồ (electricity_tax_percent = 4.5%, dual_meter_surcharge_percent = 0):
  Thuế điện = Tiền điện gốc * 4.5%
  Tổng tiền điện = Tiền điện gốc + Thuế điện
```

> Lưu ý thiết kế: `electricity_tax_percent` và `dual_meter_surcharge_percent` là 2 trường riêng biệt
> trong `billing_config`, KHÔNG được gộp chung logic — vì một phòng chỉ áp dụng MỘT trong hai
> (thuế điện HOẶC phụ thu 2 đồng hồ), tùy theo cấu hình admin đặt cho từng phòng/mặt bằng.

### 5.3. Nước

```
Nếu water_calc_type = 'per_person':
  Tiền nước = num_occupants * water_rate   (mặc định water_rate = 150,000)

Nếu water_calc_type = 'fixed':
  Tiền nước = water_rate   (admin tự đặt cố định cho phòng đó)

Nếu water_calc_type = 'per_m3':
  Số khối = new_index - old_index (từ bảng water_readings)
  Tiền nước = Số khối * water_rate   (mặc định 25,000/m³, dùng cho mặt bằng)
```

### 5.4. Tổng hóa đơn

```
Tổng hóa đơn = base_price (giá phòng)
             + Tổng tiền điện (mục 5.1 hoặc 5.2)
             + Tiền nước (mục 5.3)
             + Tổng các extra_fees trong tháng
```

Lưu toàn bộ breakdown (từng khoản, không chỉ tổng) vào `invoices.breakdown` dạng JSON để admin/tenant
xem chi tiết minh bạch, và để tránh sai lệch nếu sau này đổi `electricity_rate`.

## 6. Luồng nghiệp vụ chính

1. Admin tạo phòng → tạo `billing_config` tương ứng (chọn loại phòng, đơn giá, cách tính nước, có 2 đồng hồ hay không).
2. Đầu tháng: tenant hoặc admin nhập `meter_readings` (và `water_readings` nếu là loại `per_m3`).
3. Tenant khai báo `extra_fees` phát sinh trong tháng (VD: có thêm người ở → phụ thu).
4. Admin (hoặc cron tự động) chạy generate hóa đơn cho tháng đó:
   - Đọc `billing_config`, `meter_readings`, `water_readings`, `extra_fees` của room + month.
   - Tính theo công thức mục 5, build `breakdown` JSON.
   - Build URL QR VietQR với `amount = total_amount`, `addInfo = "Chuyen khoan qua QR"`, template `qr_only` (không hiện thông tin người nhận).
   - Insert vào `invoices`.
5. Tenant đăng nhập, xem hóa đơn tháng, quét QR chuyển khoản, admin cập nhật `status = 'paid'` thủ công (chưa có xác nhận tự động qua ngân hàng ở giai đoạn này).

## 7. CI/CD

**Repo:** GitHub, nhánh `main` (production) và `dev` (staging).

**Vercel Git Integration** (không cần viết YAML riêng cho việc deploy):
- Kết nối repo GitHub với Vercel project.
- Mỗi push lên `main` → tự động deploy production.
- Mỗi push lên nhánh khác / mỗi Pull Request → tự động tạo Preview Deployment riêng (free trên Hobby plan).

**GitHub Actions** (`.github/workflows/ci.yml`) — chạy kiểm tra TRƯỚC khi Vercel deploy, để chặn code lỗi:

```yaml
name: CI

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck   # tsc --noEmit
      - run: npm run build       # đảm bảo build không lỗi trước khi Vercel deploy
```

**Biến môi trường** (khai báo trong Vercel Project Settings + GitHub Secrets nếu Actions cần):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (chỉ dùng ở server, không expose ra client)
- `BANK_CODE`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` (hoặc lưu trong bảng `bank_info` thay vì env)

**Database migration:** dùng Supabase CLI (`supabase migration new`, `supabase db push`) để version hóa schema, migration file commit vào repo `/supabase/migrations/`.

## 8. Cấu trúc thư mục đề xuất

```
/app
  /(admin)
    /dashboard
    /rooms
    /billing-config
    /bank-info
  /(tenant)
    /invoices
    /meter-input
  /api                    -- chỉ dùng nếu cần webhook, còn lại ưu tiên Server Actions
/lib
  /supabase               -- client init (server + client)
  /billing                -- logic tính tiền thuần (unit test được, tách khỏi UI)
    calculate-electricity.ts
    calculate-water.ts
    generate-invoice.ts
  /vietqr.ts
/components
  /ui                     -- shadcn components
/supabase
  /migrations
/types
```

> Bắt buộc: logic tính tiền (mục 5) phải nằm ở `/lib/billing`, viết dạng pure function, có unit test
> riêng (Jest hoặc Vitest) — vì đây là phần nhạy cảm nhất, sai một ly là sai tiền thật.

## 9. Việc cần làm đầu tiên (Claude Code)

1. Khởi tạo Next.js 14 + TypeScript + Tailwind + shadcn/ui.
2. Setup Supabase project, chạy migration theo schema mục 4.
3. Setup Supabase Auth + RLS policies theo phân quyền mục 3.
4. Viết unit test cho `/lib/billing` theo đúng công thức mục 5 TRƯỚC khi build UI.
5. Build CRUD admin (rooms, billing_config, bank_info).
6. Build luồng nhập chỉ số + tạo hóa đơn + hiển thị QR cho tenant.
7. Setup GitHub Actions CI + kết nối Vercel.

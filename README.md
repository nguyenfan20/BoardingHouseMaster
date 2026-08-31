# BoardingHouseMaster

Web nội bộ quản lý nhà trọ (admin + tenant). Xem đặc tả đầy đủ tại [PROJECT.md](PROJECT.md).

> Đang hoàn thiện ở local trước khi deploy Vercel. Xem [CONTEXT.md](CONTEXT.md) để biết lịch
> sử thay đổi gần đây — file này được cập nhật sau mỗi thay đổi đáng kể (quy ước trong
> [CLAUDE.md](CLAUDE.md)).

## Tài liệu

- [CONTEXT.md](CONTEXT.md) — nhật ký thay đổi, cập nhật sau mỗi lần sửa đáng kể.
- [CLAUDE.md](CLAUDE.md) — quy ước làm việc trong repo cho Claude Code.
- [.claude/skills/ui-design/](.claude/skills/ui-design/) — skill định hướng thiết kế UI
  (modern minimalism, xanh lá, illustration).
- [docs/SCHEMA.md](docs/SCHEMA.md) — database schema, nguồn sự thật cho migrations.
- [docs/RLS.md](docs/RLS.md) — Row Level Security policies.
- [docs/BILLING.md](docs/BILLING.md) — công thức tính tiền, spec cho `/lib/billing`.
- [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) — luồng thông báo.
- [docs/SERVER_ACTIONS.md](docs/SERVER_ACTIONS.md) — danh sách Server Actions.
- [docs/ENV.md](docs/ENV.md) — biến môi trường.

## Chạy local — lần đầu

Yêu cầu trước: đã cài [Node.js 20+](https://nodejs.org) và [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(Supabase local chạy trong Docker). Không cần tài khoản supabase.com cho bước này.

```bash
# 1. Cài dependency
npm install

# 2. Bật Docker Desktop trước (mở app, đợi icon hết xoay/chuyển sang trạng thái running),
#    rồi mới chạy các lệnh Supabase bên dưới — thiếu bước này supabase start sẽ báo lỗi
#    kiểu "cannot connect to the Docker daemon".

# 3. Khởi tạo cấu hình Supabase (chỉ chạy 1 lần, đã có sẵn supabase/config.toml nếu ai đó
#    trong team đã làm bước này rồi thì bỏ qua)
npx supabase init

# 4. Bật Supabase local — lần đầu sẽ tải Docker image (vài phút), các lần sau nhanh hơn nhiều.
#    Lệnh này TỰ ĐỘNG áp toàn bộ supabase/migrations/*.sql vào DB local, không cần chạy thêm lệnh nào khác.
npx supabase start
```

`supabase start` in ra một khối JSON cuối cùng — copy 3 giá trị sau vào `.env.local`
(tạo file mới ở gốc repo, dựa theo `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=<giá trị API_URL, mặc định http://127.0.0.1:54321>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<giá trị ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<giá trị SERVICE_ROLE_KEY>
```

```bash
# 5. Tạo sẵn tài khoản test (1 admin + 2 tenant + 2 phòng mẫu) — xem bảng bên dưới
npm run seed:accounts

# 6. Chạy app
npm run dev
```

Mở http://localhost:3000 — sẽ vào thẳng trang đăng nhập. Đăng nhập bằng 1 trong các tài
khoản test:

| Vai trò | Email | Mật khẩu | Vào sau đăng nhập |
|---|---|---|---|
| Admin | `admin@test.local` | `Admin@12345` | `/dashboard` |
| Tenant | `tenant101@test.local` | `Tenant@12345` | `/invoices` (Phòng 101) |
| Tenant | `tenant102@test.local` | `Tenant@12345` | `/invoices` (Phòng 102) |

Muốn xem/sửa dữ liệu trực quan (thay vì query SQL): Supabase Studio tại
http://127.0.0.1:54323 (cần Docker + `supabase start` đang chạy).

`npm run seed:accounts` chạy lại nhiều lần không tạo trùng dữ liệu — an toàn nếu chạy lại.
Xem [scripts/seed-test-accounts.mjs](scripts/seed-test-accounts.mjs) để đổi email/mật khẩu
hoặc thêm tài khoản mẫu khác.

## Chạy local — những lần sau

Docker + code đã có sẵn từ lần đầu, chỉ cần:

```bash
# Bật Docker Desktop trước, rồi:
npx supabase start   # nếu container đã tắt (VD sau khi tắt máy) — không mất dữ liệu đã seed
npm run dev
```

Nếu chỉ tắt/mở lại `npm run dev` mà Docker Desktop + Supabase container vẫn đang chạy thì
không cần `supabase start` lại. Dừng hẳn Supabase local (giải phóng RAM) bằng `npx supabase stop`.

## Kiểm tra trước khi commit

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy lên Supabase thật (khi đã xong ở local)

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Cấu trúc thư mục

```
/app
  /(admin)      -- dashboard, rooms, billing-config, bank-info, extra-fees (duyệt)
  /(tenant)     -- invoices, meter-input, extra-fees (khai báo)
  /api          -- chỉ dùng khi cần webhook, hiện để trống
/lib
  /supabase     -- client/server/middleware Supabase
  /billing      -- logic tính tiền thuần, có unit test (Vitest)
  vietqr.ts
  notifications.ts
/components/ui  -- shadcn/ui components
/supabase/migrations
/types
/docs           -- specs
```

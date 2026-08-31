# ENV.md — Biến môi trường

Khai báo trong Vercel Project Settings (Production + Preview + Development) và GitHub Secrets
(cho bước `build` trong `.github/workflows/ci.yml`).

| Biến | Nơi dùng | Bí mật? | Ghi chú |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Không | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Không (nhưng không lạm dụng) | Anon key, RLS enforce quyền |
| `SUPABASE_SERVICE_ROLE_KEY` | server (Server Actions) only | **Có** | Bypass RLS — tuyệt đối không expose ra client/bundle. Không thêm tiền tố `NEXT_PUBLIC_` |

`BANK_CODE` / `BANK_ACCOUNT_NO` / `BANK_ACCOUNT_NAME` trong mục 7 PROJECT.md: **không dùng env**,
lưu trong bảng `bank_info` (admin sửa qua UI `(admin)/bank-info`) — env chỉ hợp lý nếu không có UI
quản lý, ở đây đã có nên ưu tiên DB để admin tự đổi không cần redeploy.

Local dev: copy `.env.example` → `.env.local` (đã có trong `.gitignore`).

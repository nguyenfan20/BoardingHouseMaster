# CONTEXT.md — Nhật ký thay đổi

> File này ghi lại **những gì đã đổi và tại sao**, để bất kỳ ai (hoặc Claude ở phiên sau)
> đọc vào là hiểu ngay trạng thái hiện tại của dự án mà không phải lục lại toàn bộ lịch sử
> chat. Entry mới nhất ở TRÊN CÙNG. Mỗi khi có thay đổi đáng kể (thêm bảng, thêm tính năng,
> đổi quyết định thiết kế), thêm một entry mới — không sửa lại entry cũ trừ khi entry đó ghi
> sai sự thật.

Format mỗi entry:

```
## YYYY-MM-DD — Tiêu đề ngắn

- Đổi gì (gạch đầu dòng, ngắn gọn).

**Vì sao:** lý do/quyết định đứng sau thay đổi (đặc biệt nếu không hiển nhiên từ code).
**File liên quan:** danh sách file/thư mục chính đã đổi.
```

---

## 2026-08-31 — Sửa 2 bug phát hiện khi người dùng test tay: lặp chữ "Tháng" + crash khi đăng nhập

- **Lặp chữ "Tháng tháng 08, 2026"**: `Date#toLocaleDateString("vi-VN", {month:"2-digit",
  year:"numeric"})` tự chèn thêm chữ "tháng" vào kết quả locale vi-VN, cộng với chữ "Tháng "
  tự viết trong JSX nên bị lặp. Thêm `formatMonthLabel()` (parse chuỗi ISO thủ công, trả về
  "MM/YYYY", không phụ thuộc locale/timezone) trong `lib/utils.ts`, thay thế ở 4 nơi:
  `(tenant)/invoices` (list + detail), `(tenant)/meter-input`, `(admin)/extra-fees-review`.
- **Crash khi đăng nhập (màn hình lỗi đỏ Next dev)**: `app/login/actions.ts` gọi `redirect()`
  ngay trong Server Action, nhưng action này được gọi trực tiếp từ client (`login-form.tsx`,
  không qua `<form action>`) — khiến promise phía client resolve về `undefined` thay vì giá
  trị mong đợi, code đọc `result.success` trên `undefined` nên throw, tạo unhandled promise
  rejection mà Next dev hiển thị thành overlay lỗi. Sửa: `signInWithPassword` giờ trả
  `{success, redirectTo}` thay vì tự `redirect()`, `login-form.tsx` tự `router.push(redirectTo)`
  khi thành công — cùng pattern `register-form.tsx` đã dùng đúng từ đầu.
- **Bài học áp dụng chung**: không gọi `redirect()` bên trong một Server Action được client
  gọi trực tiếp (không qua `<form action={...}>`) nếu code gọi có đọc giá trị trả về — luôn
  trả dữ liệu (kể cả đường dẫn đích) và để client tự điều hướng bằng `router.push()`.
  `signOut()` (`app/login/actions.ts`) vẫn giữ `redirect()` vì nơi gọi
  (`sign-out-button.tsx`) không đọc kết quả trả về nên không bị ảnh hưởng.

**Vì sao:** Người dùng tự test và báo cả hai lỗi (ảnh chụp màn hình "Tháng tháng 08, 2026" +
"khi login tenant vào thì hệ thống báo error"). Xác nhận lại bằng browser thật + console log
(`read_console_messages`) trước khi sửa, không đoán mò.
**File liên quan:** `lib/utils.ts`, `app/(tenant)/invoices/page.tsx`,
`app/(tenant)/invoices/[invoiceId]/page.tsx`, `app/(tenant)/meter-input/page.tsx`,
`app/(admin)/extra-fees-review/review-list.tsx`, `app/login/actions.ts`, `app/login/login-form.tsx`.

## 2026-08-31 — Bật Supabase local + test end-to-end, sửa lỗi ẩn nút đăng xuất trên mobile

- Chạy `npx supabase init` + `npx supabase start` (Docker) — migrations `0001_init.sql` và
  `0002_room_invites.sql` áp thành công lên DB local. `.env.local` đã điền URL/anon
  key/service role key của instance local này (file bị gitignore, không commit).
- Chạy `npm run seed:accounts` — tạo thành công 2 phòng mẫu + 1 admin + 2 tenant test
  (xem README § Tài khoản test).
- Test tay end-to-end qua browser: đăng nhập admin → route đúng `/dashboard` → tạo link mời ở
  `/rooms/[roomId]` → mở link ở tab khác → tenant tự đăng ký → đăng nhập tenant → route đúng
  `/invoices` → vào `/rooms` (route admin) khi đang là tenant tự động redirect về `/invoices`
  (xác nhận `requireRolePage` hoạt động đúng cả hai chiều). "Tạo hóa đơn" khi chưa có chỉ số
  điện báo lỗi đúng như thiết kế.
- **Bug tìm thấy và đã sửa**: nút "Đăng xuất" ở tenant layout bị `hidden md:block` — tenant
  dùng điện thoại (đối tượng chính của layout tenant) không có cách nào đăng xuất. Sửa
  `components/sign-out-button.tsx` thêm prop `variant` ("block" cho sidebar admin, "inline"
  cho header tenant), luôn hiển thị ở mọi kích thước màn hình.

**Vì sao:** Cần một Supabase project thật (local) để trang bị test account theo yêu cầu người
dùng, và test tay là cách duy nhất phát hiện được lỗi UI ẩn nút trên mobile mà build/typecheck
không bắt được.
**File liên quan:** `.env.local` (không commit), `supabase/config.toml`,
`components/sign-out-button.tsx`, `app/(tenant)/layout.tsx`, README.md.

## 2026-08-31 — Login là trang chính, route theo role, UI đầy đủ admin/tenant, seed test

- `/` và `/login` giờ tự kiểm tra session: đã đăng nhập → redirect thẳng `/dashboard` (admin)
  hoặc `/invoices` (tenant); chưa đăng nhập → về `/login`. Login thật (Supabase Auth) +
  đăng xuất.
- Route guard ở tầng layout: `app/(admin)/layout.tsx` và `app/(tenant)/layout.tsx` chặn UI
  bằng `redirect()` nếu chưa đăng nhập hoặc sai role (`lib/auth.ts` → `requireRolePage`),
  thay vì chỉ dựa vào RLS như trước.
- Xây đầy đủ UI + Server Actions thật cho các trang còn lại theo skill `ui-design`: tạo
  phòng (`rooms`), sửa `billing_config` theo phòng, `bank-info`, duyệt `extra_fees`
  (`extra-fees-review`), dashboard admin (thống kê), danh sách + chi tiết hóa đơn tenant
  (kèm QR), nhập chỉ số điện/nước tenant, khai báo phụ phí tenant.
- Thêm chức năng "Tạo hóa đơn" ở trang chi tiết phòng (admin) — chạy `lib/billing` thật, ghi
  vào `invoices`, build QR qua `lib/vietqr.ts`.
- Thêm `scripts/seed-test-accounts.mjs` (`npm run seed:accounts`) — tạo 2 phòng mẫu + 1 admin
  + 2 tenant test qua Supabase Admin API, idempotent.

**Vì sao:** Yêu cầu người dùng — muốn login là điểm vào chính của app và tự route theo role;
muốn toàn bộ UI admin/tenant theo đúng skill vừa tạo thay vì còn là trang placeholder; hỏi đã
có tài khoản test chưa — câu trả lời là chưa (chưa có Supabase project nào được cấu hình/chạy
ở máy này), nên chuẩn bị sẵn script tạo tài khoản thay vì tạo thủ công mỗi lần.
**File liên quan:** `app/page.tsx`, `app/login/`, `lib/auth.ts`,
`app/(admin)/layout.tsx`, `app/(tenant)/layout.tsx`, `app/(admin)/rooms/`,
`app/(admin)/billing-config/`, `app/(admin)/bank-info/`, `app/(admin)/extra-fees-review/`,
`app/(admin)/dashboard/`, `app/(tenant)/invoices/`, `app/(tenant)/meter-input/`,
`app/(tenant)/extra-fees/`, `scripts/seed-test-accounts.mjs`, `package.json`, `README.md`.

## 2026-08-31 — Khởi tạo project + đăng ký tài khoản tenant qua link + skill UI

- Tạo `CONTEXT.md` (file này) và `CLAUDE.md` — quy ước cập nhật context sau mỗi thay đổi.
- Thêm `.claude/skills/ui-design/` — skill định hướng thiết kế UI cho toàn bộ dự án
  (modern minimalism, xanh lá làm màu chủ đạo, illustration dạng flat SVG). Xem
  `.claude/skills/ui-design/SKILL.md`.
- Thêm bảng `room_invites` (link đăng ký tài khoản tenant, dùng 1 lần, hết hạn 7 ngày) +
  trang admin tạo/thu hồi link tại chi tiết phòng + trang `/register` công khai cho tenant
  tự đặt mật khẩu.
- Áp responsive + theme xanh lá (theo skill ui-design) vào `tailwind.config.ts` và layout
  admin/tenant.

**Vì sao:** Yêu cầu người dùng — muốn hoàn thiện app ở local trước khi deploy Vercel; cần
cách tenant tự tạo tài khoản mà không cần admin biết mật khẩu; cần một nơi tập trung ghi lại
quyết định UI để không phải lặp lại mỗi lần yêu cầu style.
**File liên quan:** `CONTEXT.md`, `CLAUDE.md`, `.claude/skills/ui-design/`,
`docs/SCHEMA.md`, `docs/RLS.md`, `docs/SERVER_ACTIONS.md`,
`supabase/migrations/0002_room_invites.sql`, `app/(admin)/rooms/`, `app/register/`,
`tailwind.config.ts`, `app/(admin)/layout.tsx`, `app/(tenant)/layout.tsx`.

## 2026-08-31 — Scaffold ban đầu

- Đọc `PROJECT.md`, Q&A làm rõ 4 điểm mơ hồ (extra_fees cần duyệt + notifications, nhiều
  tenant/phòng, cờ `allow_tenant_meter_input` per-room, upsert khi generate lại invoice).
- Tạo cấu trúc thư mục Next.js 14 App Router thật (build/lint/typecheck/test đều chạy được),
  viết specs (`docs/SCHEMA.md`, `docs/RLS.md`, `docs/BILLING.md`, `docs/NOTIFICATIONS.md`,
  `docs/SERVER_ACTIONS.md`, `docs/ENV.md`), migration `0001_init.sql`, implement thật
  `/lib/billing` kèm 10 unit test Vitest (đều pass).

**Vì sao:** Điểm khởi đầu dự án, theo mục 8-9 `PROJECT.md`.
**File liên quan:** toàn bộ repo (lần commit đầu).

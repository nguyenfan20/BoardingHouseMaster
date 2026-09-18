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

## 2026-09-18 — Trang hồ sơ tenant: đổi mật khẩu + sửa thông tin cá nhân

- Thêm `app/(tenant)/profile/` (page + actions + 2 form) — tenant tự sửa `full_name`/`phone` và
  tự đổi mật khẩu, thêm mục "Hồ sơ" vào `components/tenant-nav.tsx`.
- `updateMyProfile` ghi thẳng vào bảng `users` (cùng dòng admin đang query ở trang chi tiết
  phòng) nên **admin thấy thông tin tenant vừa sửa ngay, không cần đồng bộ gì thêm** — đây vốn
  là một query trực tiếp, không cache riêng.
- Migration `0007_users_tenant_self_update.sql`: thêm RLS policy cho tenant UPDATE dòng `users`
  của chính mình — trước đó chỉ admin UPDATE được. Không enforce whitelist cột ở DB (trigger),
  theo đúng cách `notifications_update` đã làm: RLS là lớp phòng thủ thứ hai, Server Action chỉ
  ghi đúng 2 field cho phép.
- `changeMyPassword` phải tự `signInWithPassword` lại bằng mật khẩu hiện tại trước khi gọi
  `auth.updateUser({password})`, vì Supabase không tự đòi mật khẩu cũ khi đổi.
- Không thêm field CMND/địa chỉ/email — chưa có yêu cầu, schema `users` hiện chỉ có
  `full_name`/`phone` (SCHEMA.md Quyết định #9).

**Vì sao:** tenant trước đó không có nơi tự cập nhật thông tin/đổi mật khẩu sau khi admin tạo
tài khoản qua link mời — phải nhờ admin sửa hộ trong Supabase Dashboard.
**File liên quan:** `app/(tenant)/profile/`, `components/tenant-nav.tsx`, `lib/auth.ts`
(`getCurrentProfile` giờ select thêm `phone`), `supabase/migrations/0007_users_tenant_self_update.sql`,
`docs/SCHEMA.md`, `docs/RLS.md`, `docs/SERVER_ACTIONS.md`.

## 2026-09-13 — Admin nhập được chỉ số điện/nước (trước đó tắt quyền tenant là bế tắc)

- **Lỗ hổng**: `billing_config.allow_tenant_meter_input = false` thì tenant không thấy trang nhập
  chỉ số, mà phía admin CHƯA có chỗ nào nhập — không bảng nào trong app ghi `meter_readings`/
  `water_readings` ngoài trang tenant (`upsertMeterReading`/`upsertWaterReading` trong
  SERVER_ACTIONS.md chỉ là dự kiến, chưa có code). Hệ quả: phòng tắt cờ đó thì `generateInvoiceForRoom`
  luôn trả "Thiếu chỉ số điện của tháng này" và không bao giờ tạo được hóa đơn.
- **Thêm 2 Server Action** `upsertMeterReadingAsAdmin` / `upsertWaterReadingAsAdmin` trong
  `app/(admin)/rooms/[roomId]/actions.ts` (`recorded_by = 'admin'`, upsert theo unique key sẵn có,
  validate `new_index >= old_index`) + mục **"Chỉ số điện / nước"** ở trang chi tiết phòng, nằm
  TRƯỚC mục Hóa đơn: chọn tháng (mặc định theo `billing_day` của phòng, giống ô tháng của form tạo
  hóa đơn), nhập 1 hoặc 2 đồng hồ tuỳ `has_dual_meter`, có thêm phần nước nếu `water_calc_type =
  'per_m3'`. Chỉ số cũ tự gợi ý bằng chỉ số mới của tháng gần nhất trước đó.
- Quyền của admin KHÔNG phụ thuộc `allow_tenant_meter_input` — cờ đó chỉ mở thêm quyền cho tenant
  (SCHEMA.md Quyết định #3). Đã ghi rõ câu này trong help text của checkbox ở `billing-config`.
- Form dùng `key={month}` để remount khi đổi tháng — `defaultValue` của input không tự cập nhật
  theo prop, nếu không remount thì đổi tháng vẫn hiện số của tháng cũ.
- **Kiểm tra**: lint/typecheck/test/build sạch. Upsert test bằng psql với JWT admin: insert rồi
  upsert lần 2 ghi đè đúng (`new_index` 150 → 180, `recorded_by='admin'`), `water_readings` tương tự.

**Vì sao:** người dùng báo "chọn tenant không tự nhập số điện thì trang phòng không có chỗ admin
nhập chỉ số" — đúng, và nó chặn luôn cả việc tạo hóa đơn cho phòng đó.
**File liên quan:** `app/(admin)/rooms/[roomId]/{actions.ts,page.tsx,meter-reading-section.tsx}`,
`app/(admin)/billing-config/[roomId]/billing-config-form.tsx`, `docs/SERVER_ACTIONS.md`.

## 2026-09-13 — Xem tài khoản đã đăng ký của từng phòng + chẩn đoán build fail ngẫu nhiên

- **Mục "Tài khoản đã đăng ký" ở `(admin)/rooms/[roomId]`**: liệt kê mọi user có `room_id` = phòng
  đó (họ tên, email, điện thoại, thời điểm đăng ký) — table ở `md+`, card ở mobile. Một phòng có
  thể có nhiều tài khoản (Quyết định #2, SCHEMA.md) nên đây là danh sách, không phải 1 dòng.
- **Email lấy qua Admin API**, không phải từ bảng `users`: email chỉ nằm ở `auth.users`, nên trang
  gọi `createServiceRoleClient().auth.admin.listUsers()` một lần rồi map theo id. Trang đã nằm sau
  `requireRolePage("admin")` của layout, và bọc `try/catch` để lỗi Admin API chỉ làm mất cột email
  chứ không sập trang.
- **Chẩn đoán được build fail ngẫu nhiên** (đã gặp ở 2 lượt trước và tưởng là race của Windows):
  `next build` luôn probe route Pages Router `/_app` qua `getDefinedNamedExports`
  (`node_modules/next/dist/build/index.js:1142`), promise này được tạo sớm nhưng chỉ await muộn;
  project này không có thư mục `pages/` nên nó reject ngay → nếu reject xảy ra trước khi handler
  kịp gắn, Node coi là unhandledRejection và giết build. Đây là bug của Next 14 với project
  app-router-only, không liên quan code dự án: cùng một commit build lại là pass (đã xác nhận
  fail/pass xen kẽ với code y nguyên). Cách xử lý hiện tại: build lại. Nếu về sau muốn hết hẳn thì
  nâng Next lên 15.

**Vì sao:** người dùng cần xem phòng nào đã có tài khoản nào (đối chiếu với link mời đã phát).
**File liên quan:** `app/(admin)/rooms/[roomId]/page.tsx`.

## 2026-09-13 — Trang lịch sử đăng ký xe cho admin + tự xoá sau 30 ngày

- **Trang mới `(admin)/parking-requests`** ("Lịch sử đăng ký xe", có trong admin nav): liệt kê các
  đăng ký `scheduled_at < now()` (đã qua giờ hẹn), table ở `md+` và card ở mobile theo đúng pattern
  bắt buộc của ui-design skill. Dashboard vẫn chỉ hiện đăng ký sắp tới, thêm link "Xem lịch sử →".
- **Tự xoá sau 30 ngày**: trang lịch sử `delete ... lt('scheduled_at', now - 30 ngày)` ngay trong
  Server Component trước khi query danh sách — dọn kiểu lazy mỗi lần admin mở trang, không dùng
  `pg_cron`/job chạy nền (nhà trọ 1 admin, không cần hạ tầng nền; có comment `ponytail:` ghi rõ
  trần của cách này và đường nâng cấp). RLS cho admin xoá mọi dòng nên không cần service-role key.
- **Kiểm tra**: lint/typecheck/test/build sạch. Test mốc 30 ngày bằng psql với JWT của admin:
  dòng 40 ngày bị xoá, dòng 29 ngày và dòng sắp tới còn nguyên, trang lịch sử chỉ lấy dòng đã qua.

**Vì sao:** yêu cầu người dùng — dashboard chỉ để xem việc sắp phải làm, lịch sử tách sang trang
riêng và không giữ quá 30 ngày.
**File liên quan:** `app/(admin)/parking-requests/page.tsx`, `app/(admin)/dashboard/page.tsx`,
`components/admin-nav.tsx`, `docs/SCHEMA.md`, `docs/SERVER_ACTIONS.md`.

## 2026-09-13 — Thông báo đọc được: chuông có badge + trang /notifications, thêm thông báo hóa đơn mới

- **Chuông thông báo giờ hoạt động thật**: `components/notification-bell.tsx` từ icon tĩnh (có
  TODO từ trước) thành Server Component đọc count `is_read = false` bằng RLS của chính user
  (không cần service-role key), hiện badge số (>9 → "9+") và link tới `/notifications`.
- **Trang `/notifications` dùng chung cho cả 2 role**: đặt ngoài route group `(admin)`/`(tenant)`
  vì hai group không thể cùng khai báo route `/notifications` (Next báo lỗi parallel pages trùng
  path) — trang tự `getCurrentProfile()` + redirect `/login`, có link "Quay lại" về home theo role.
  Click 1 thông báo → `markNotificationRead(id)` rồi điều hướng theo `related_table`/`related_id`
  (map đích khác nhau giữa admin và tenant), kèm nút "Đánh dấu tất cả đã đọc" để badge không
  treo vĩnh viễn với thông báo không có đích để bấm.
- **`generateInvoiceForRoom` tạo notification `invoice_created`** cho mọi user của phòng khi hóa
  đơn được tạo MỚI (dựa vào biến `existing` đã query sẵn để không báo lại mỗi lần bấm cập nhật)
  — đúng như docs/SERVER_ACTIONS.md và NOTIFICATIONS.md đã đặc tả nhưng code còn thiếu. Thêm
  `revalidatePath("/invoices")` để danh sách hóa đơn phía tenant cũng mới theo.
- **Kiểm tra**: lint/typecheck/test/build sạch. RLS `notifications` test bằng psql với JWT claims
  thật: tenant chỉ select/đếm thông báo của mình, update thông báo của người khác trả 0 dòng,
  "đánh dấu tất cả" chỉ ảnh hưởng dòng của mình.

**Ghi chú khi build trên máy này:** dev server đang chạy giữ `.next` nên `next build` lỗi
`EPERM: .next	race`. Cách làm: tạm đặt `distDir: ".next-verify"` trong `next.config.mjs`, build,
rồi trả lại config + `git checkout -- tsconfig.json` (Next tự thêm `.next-verify/types` vào
`include` của tsconfig). Trong lúc đó có gặp build fail kiểu
`unhandledRejection PageNotFoundError: Cannot find module for page: /_document` ở bước
"Collecting page data" — xem chẩn đoán chính xác ở entry "Xem tài khoản đã đăng ký..." bên trên:
đây là bug của Next 14 với project chỉ dùng App Router, mang tính ngẫu nhiên theo thời điểm,
KHÔNG phải lỗi code của mình.

**Vì sao:** người dùng yêu cầu bít 2 lỗ hổng đã báo ở lượt trước — thông báo được ghi vào DB
(phụ phí, gửi xe, hóa đơn đã thanh toán) nhưng không ai đọc được, và thiếu thông báo khi có hóa
đơn mới.
**File liên quan:** `components/notification-bell.tsx`, `app/notifications/{page.tsx,actions.ts,notification-list.tsx}`,
`app/(admin)/rooms/[roomId]/actions.ts`, `docs/SERVER_ACTIONS.md`.

## 2026-09-13 — Ngày chốt tiền theo phòng, đăng ký gửi xe, sửa menu mobile admin

- **Sửa responsive admin**: dưới `md` sidebar bị `hidden` nên tên user + nút **Đăng xuất** (thứ duy
  nhất chỉ sống trong sidebar) mất hẳn trên điện thoại — drawer hamburger chỉ render `<AdminNav>`.
  Nay drawer render đủ header + nav + tên user + đăng xuất, `AdminMobileMenu` nhận prop `userName`.
  Cùng lớp lỗi đã sửa cho tenant ngày 2026-08-31, lần này ở phía admin.
- **Ngày chốt tiền/lập hóa đơn riêng cho từng phòng**: thêm `billing_config.billing_day`
  (int, default 1, check 1..28) + pure function `lib/billing/billing-cycle.ts`
  (`billingMonthFor`, `normalizeBillingDay`, `billingCycleDate`) có unit test. Admin đổi ở
  `billing-config/[roomId]` (mục 4 của form), thấy lại ở danh sách `billing-config`. Logic dùng
  ở 2 nơi: ô "Tháng lập hóa đơn" trong `rooms/[roomId]` mặc định theo kỳ đang chốt (chưa tới
  ngày chốt → vẫn là kỳ tháng trước), và dashboard admin liệt kê phòng đã tới ngày chốt mà kỳ
  đó chưa có hóa đơn ("Cần tạo hóa đơn" + stat card thứ 4).
- **Chức năng mới "Gửi xe"**: bảng `parking_requests` (room_id, created_by, plate_number,
  scheduled_at, note) + trang tenant `(tenant)/parking` (form biển số + `datetime-local`, danh
  sách sắp tới/đã qua, nút Hủy cho đăng ký của mình) + tab "Gửi xe" trong tenant nav. Mỗi đăng ký
  bắn `notifications` type `general` cho tất cả admin và hiện ở mục "Đăng ký gửi xe sắp tới" trên
  dashboard admin. Không có bước duyệt, không có cột `status` — đây là thông báo trước để admin
  sắp xếp chỗ, không phải luồng phê duyệt.
- **Sửa bug danh sách hóa đơn trong `generate-invoice-section.tsx`**: component copy
  `initialInvoices` vào `useState` nên hóa đơn vừa tạo/đánh dấu đã thanh toán không xuất hiện cho
  tới khi reload. Bỏ state, đọc thẳng prop `invoices` (các action đều `revalidatePath` nên Next
  tự đẩy danh sách mới xuống) — ít code hơn và luôn đúng.
- **Dọn lệch docs/type**: alias `NotificationType` trong `types/database.ts` liệt kê
  `invoice_issued`/`invoice_reminder` không tồn tại trong check constraint của DB → sửa cho khớp
  0001 (`invoice_created`/`invoice_paid`/`general`); RLS.md cập nhật lại policy insert
  `extra_fees` cho khớp migration 0004 (`declared`/`pending`).
- **Kiểm tra**: `lint`/`typecheck`/`test` (20 test)/`build` đều sạch. RLS của
  `parking_requests` test trực tiếp bằng psql với `request.jwt.claims` của tenant/admin thật:
  tenant insert cho phòng mình OK, insert hộ phòng khác bị chặn, chỉ select/xoá được dòng phòng
  mình, admin thấy tất cả. Constraint `billing_day` chặn 0 và 31.

**Vì sao:** 4 yêu cầu của chủ dự án trong một lượt (mất nút trên mobile admin, ngày tính tiền
theo phòng, trang đăng ký gửi xe cho tenant + thông báo ở dashboard admin, rà lỗi còn lại).
Ngày chốt lưu ở `billing_config` (đã là bảng cấu hình 1-1 với phòng) thay vì bảng lịch riêng, và
suy ra kỳ hóa đơn bằng pure function thay vì cron/job — không cần hạ tầng chạy nền cho MVP.
**File liên quan:** `supabase/migrations/0006_billing_day_and_parking_requests.sql`,
`lib/billing/billing-cycle.ts` (+ test), `types/database.ts`, `components/admin-mobile-menu.tsx`,
`app/(admin)/layout.tsx`, `app/(admin)/dashboard/page.tsx`,
`app/(admin)/billing-config/page.tsx`, `app/(admin)/billing-config/[roomId]/{page,actions,billing-config-form}`,
`app/(admin)/rooms/[roomId]/{page.tsx,generate-invoice-section.tsx}`,
`app/(tenant)/parking/*`, `components/tenant-nav.tsx`, `lib/utils.ts`,
`docs/{SCHEMA,RLS,SERVER_ACTIONS,BILLING,NOTIFICATIONS}.md`.

## 2026-08-31 — Palette màu mới, tách thuế trong hóa đơn, tải PDF, dọn `router.refresh()` thừa

- **Đổi palette màu** theo yêu cầu chủ dự án: chủ đạo `#546B41` (olive xanh rêu), phụ
  `#99AD7A` (sage), `#DCCCAC` (tan — border/neutral-200), `#FFF8EC` (cream — nền trang/
  neutral-50). Chuyển từ tông xanh lá mát (SaaS) sang tông ấm hơn. Cập nhật
  `tailwind.config.ts`, `.claude/skills/ui-design/references/palette.md` (bảng công thức
  pha màu để tái lập được), `SKILL.md`, và toàn bộ hex cứng trong `components/illustrations.tsx`
  + ví dụ minh hoạ trong `components.md`.
- **Tách thuế điện riêng trong hóa đơn tenant** (`(tenant)/invoices/[invoiceId]`): trước đây
  "Tiền điện" gộp luôn thuế/phụ thu vào 1 dòng (`totalElectric`), giờ tách 2 dòng riêng
  ("Tiền điện (x kWh)" = tiền gốc, "Thuế điện (y%)" hoặc "Phụ thu 2 đồng hồ (y%)" tuỳ loại
  phòng) — dữ liệu đã có sẵn trong `breakdown.electricity.tax`/`.surcharge`, chỉ là chưa
  hiển thị tách bạch.
- **Thiết kế lại trang chi tiết hóa đơn** thành 1 card "hóa đơn" thống nhất (header HÓA ĐƠN
  TIỀN TRỌ + tên phòng + tháng + trạng thái, bảng chi tiết, QR nằm CHUNG trong card thay vì
  tách rời phía trên như trước).
- **Thêm "Tải hóa đơn (PDF)"**: dùng `window.print()` + CSS `print:` (Tailwind variant) thay
  vì thư viện tạo PDF phía client (đã thử `jspdf` rồi gỡ) — font PDF chuẩn của các thư viện
  đó thiếu dấu tiếng Việt, in trình duyệt dùng font hệ thống nên luôn đúng, và trình duyệt
  hiện đại có sẵn tuỳ chọn "Save as PDF" trong hộp thoại in. Pattern ghi trong
  `components.md` để tái dùng cho các trang khác sau này.
- **Dọn `router.refresh()` thừa** ở 5 form (billing-config, bank-info, create-room,
  meter-input, extra-fees declare) — mỗi Server Action tương ứng đã tự `revalidatePath()`,
  Next tự động refetch RSC sau khi action chạy xong; gọi thêm `router.refresh()` phía client
  tạo ra 1 request đua với request tự động đó (thấy `net::ERR_ABORTED` trong Network tab dù
  request đầu vẫn 200 và dữ liệu đã lưu đúng — không mất dữ liệu, nhưng gây khó chịu khi debug).

**Về báo lỗi "POST /rooms/... 200 in 215ms" khi lưu cấu hình tính tiền**: đã tái hiện trực
tiếp trên browser (đăng nhập admin, sửa `billing-config/[roomId]`, bấm Lưu) và xác nhận
KHÔNG có lỗi thật — dòng log đó là log truy cập bình thường của Next dev server cho một
request THÀNH CÔNG (status 200), không phải thông báo lỗi. Dữ liệu lưu đúng (kiểm tra lại
bằng cách load lại trang, giá trị mới vẫn còn). Đường dẫn `/rooms/...` trong log không khớp
route `/billing-config/...` hiện tại — có thể do log cũ từ trước khi trang chi tiết phòng
được xây thêm nội dung, hoặc dán nhầm dòng log. Đã dọn `router.refresh()` thừa như trên để
giảm nhiễu log dù không phải nguyên nhân gốc.

**Vì sao:** Yêu cầu người dùng — đổi màu theo bộ nhận diện đã chốt; hóa đơn cần minh bạch
thuế để tenant không thắc mắc; QR cần nằm trong ngữ cảnh hóa đơn thay vì rời rạc; cần xuất
được hóa đơn dạng file.
**File liên quan:** `tailwind.config.ts`, `.claude/skills/ui-design/`,
`components/illustrations.tsx`, `app/(tenant)/invoices/[invoiceId]/`, `app/globals.css`,
`app/(tenant)/layout.tsx`, `components/tenant-nav.tsx`,
`app/(admin)/billing-config/[roomId]/billing-config-form.tsx`,
`app/(admin)/bank-info/bank-info-form.tsx`, `app/(admin)/rooms/create-room-form.tsx`,
`app/(tenant)/meter-input/meter-input-form.tsx`, `app/(tenant)/extra-fees/declare-form.tsx`.

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

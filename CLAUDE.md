# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Bắt buộc: cập nhật CONTEXT.md

Sau khi hoàn thành bất kỳ thay đổi đáng kể nào (thêm/sửa schema, thêm tính năng, đổi quyết
định thiết kế/kiến trúc, thêm dependency lớn) — thêm một entry mới lên **đầu** [CONTEXT.md](CONTEXT.md)
theo đúng format đã ghi trong file đó (tiêu đề + gạch đầu dòng + **Vì sao:** + **File liên
quan:**). Không cần ghi cho những việc vụn vặt (sửa typo, format lại code, đổi 1 dòng CSS).

## Tài liệu khác cần đọc trước khi đổi phần liên quan

- [PROJECT.md](PROJECT.md) — đặc tả gốc của dự án.
- [docs/SCHEMA.md](docs/SCHEMA.md) — sửa TRƯỚC khi viết migration mới.
- [docs/BILLING.md](docs/BILLING.md) — sửa TRƯỚC khi đổi công thức tính tiền trong `/lib/billing`.
- [docs/RLS.md](docs/RLS.md) — chính sách phân quyền theo bảng.
- [docs/SERVER_ACTIONS.md](docs/SERVER_ACTIONS.md) — danh sách Server Actions hiện có/dự kiến.
- [.claude/skills/ui-design/SKILL.md](.claude/skills/ui-design/SKILL.md) — dùng khi thiết kế/style
  bất kỳ trang hay component nào (palette, layout, responsive, trạng thái component).

## Trước khi coi một thay đổi code là xong

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Cả 4 lệnh phải sạch — đây cũng chính là những gì `.github/workflows/ci.yml` chạy.

## Quy ước dự án

- Ngôn ngữ giao tiếp trong docs/comment: tiếng Việt (khớp với PROJECT.md và người dùng).
- Ngôn ngữ code (biến, hàm, field): tiếng Anh.
- Ưu tiên Server Actions hơn `/app/api` route, trừ khi thực sự cần webhook.
- Logic tính tiền phải là pure function trong `/lib/billing`, có unit test — không viết
  công thức tiền trực tiếp trong component/action.

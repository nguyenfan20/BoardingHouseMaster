-- Migration: Cho phép tenant khai báo phụ phí không cần nhập số tiền.
-- Số tiền sẽ do admin điền vào sau khi duyệt và đưa vào hóa đơn.
-- Đồng thời bỏ trạng thái pending/approved/rejected vì không còn bước duyệt —
-- tenant chỉ "khai báo" để admin thấy, admin tự thêm số tiền khi lập hóa đơn.

-- 1. Cho phép amount null (tenant không nhập)
alter table extra_fees alter column amount drop not null;

-- 2. Mở rộng status check để thêm trạng thái 'declared' thay cho 'pending'
--    (giữ lại pending/approved/rejected để không breaking nếu có dữ liệu cũ)
alter table extra_fees drop constraint if exists extra_fees_status_check;
alter table extra_fees
  add constraint extra_fees_status_check
  check (status in ('declared', 'pending', 'approved', 'rejected'));

-- 3. Đổi default status từ 'pending' → 'declared'
alter table extra_fees alter column status set default 'declared';

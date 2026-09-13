-- Migration: Thêm invoice_id vào extra_fees để theo dõi phụ phí đã được đưa vào hóa đơn nào
alter table extra_fees
  add column if not exists invoice_id uuid references invoices(id) on delete set null;

create index if not exists idx_extra_fees_invoice_id on extra_fees(invoice_id);

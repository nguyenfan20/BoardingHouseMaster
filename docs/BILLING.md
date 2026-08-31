# BILLING.md — Công thức tính tiền (nguồn sự thật cho `/lib/billing`)

> Đây là bản chi tiết hoá mục 5, PROJECT.md, dùng làm spec cho unit test. Mọi thay đổi công thức
> phải sửa file này trước, rồi mới sửa code + test trong `/lib/billing`.
> Toàn bộ hàm trong `/lib/billing` phải là **pure function** (input → output, không side effect,
> không gọi DB) để test được độc lập.

## 1. Điện — phòng thường (1 đồng hồ, `has_dual_meter = false`)

Input: `{ oldIndex, newIndex, electricityRate, electricityTaxPercent }`

```
consumedKwh   = newIndex - oldIndex
electricity   = consumedKwh * electricityRate
tax           = electricity * (electricityTaxPercent / 100)
totalElectric = electricity + tax
```

Output breakdown: `{ consumedKwh, electricity, tax, totalElectric }`

## 2. Điện — 2 đồng hồ (`has_dual_meter = true`)

Input: `{ indoor: {oldIndex,newIndex}, outdoor: {oldIndex,newIndex}, electricityRate, electricityTaxPercent, dualMeterSurchargePercent }`

```
consumedIndoor  = indoor.newIndex - indoor.oldIndex
consumedOutdoor = outdoor.newIndex - outdoor.oldIndex
consumedKwh     = consumedIndoor + consumedOutdoor
electricity     = consumedKwh * electricityRate   // "Tiền điện gốc"

// CHỈ MỘT trong hai áp dụng — không cộng cả hai:
if dualMeterSurchargePercent > 0:
    surcharge     = electricity * (dualMeterSurchargePercent / 100)
    totalElectric = electricity + surcharge
    tax = 0
else:
    tax           = electricity * (electricityTaxPercent / 100)
    totalElectric = electricity + tax
    surcharge = 0
```

> **Invariant bắt buộc** (kiểm tra ở tầng validate `billing_config`, không phải ở hàm tính tiền):
> với mỗi phòng, `electricity_tax_percent > 0` VÀ `dual_meter_surcharge_percent > 0` không được
> đồng thời xảy ra. Nếu cả hai đều 0, tổng tiền điện = tiền điện gốc, không cộng gì thêm.

Output breakdown: `{ consumedIndoor, consumedOutdoor, consumedKwh, electricity, surcharge, tax, totalElectric }`

## 3. Nước

### 3.1 `per_person`
```
water = numOccupants * waterRate   // waterRate mặc định 150,000
```

### 3.2 `fixed`
```
water = waterRate   // admin đặt cố định cho phòng
```

### 3.3 `per_m3`
```
consumedM3 = newIndex - oldIndex   // từ water_readings
water = consumedM3 * waterRate     // waterRate mặc định 25,000
```

Output breakdown: `{ calcType, waterRate, numOccupants?, consumedM3?, water }`

## 4. Extra fees

Chỉ cộng các dòng `extra_fees` có `status = 'approved'` trong tháng đó.

```
extraFeesTotal = sum(fee.amount for fee in extraFees if fee.status == 'approved')
```

Output breakdown: `{ items: [{feeName, amount, note}], extraFeesTotal }`

## 5. Tổng hóa đơn

```
totalAmount = basePrice + totalElectric + water + extraFeesTotal
```

## 6. Cấu trúc `invoices.breakdown` (JSON lưu trong DB)

```jsonc
{
  "basePrice": 2500000,
  "electricity": { /* output mục 1 hoặc mục 2, kèm field "meterType": "single" | "dual" */ },
  "water": { /* output mục 3 */ },
  "extraFees": { /* output mục 4 */ },
  "totalAmount": 3120000,
  "ratesSnapshot": {
    "electricityRate": 3500,
    "electricityTaxPercent": 4.5,
    "dualMeterSurchargePercent": 0,
    "waterRate": 150000
  }
}
```

> Snapshot toàn bộ đơn giá tại thời điểm generate — để sau này đổi `electricity_rate` trong
> `billing_config` không làm sai lệch hóa đơn cũ đã tạo.

## 7. `generate-invoice.ts` — luồng tổng hợp

```
generateInvoice(roomId, month):
  1. Đọc billing_config, room (base_price, num_occupants)
  2. Đọc meter_readings của room+month (1 hoặc 2 dòng tuỳ has_dual_meter)
  3. Nếu water_calc_type == 'per_m3': đọc water_readings của room+month
  4. Đọc extra_fees của room+month có status = 'approved'
  5. Tính theo mục 1-5 ở trên → breakdown, totalAmount
  6. Build qr_url qua lib/vietqr.ts: amount=totalAmount, addInfo="Tien tro <room.name> <month>"
  7. Upsert vào invoices theo (room_id, month):
     - nếu invoice cũ tồn tại và status = 'paid' → throw lỗi, không ghi đè
     - ngược lại → upsert breakdown/total_amount/qr_url, giữ status hiện có (không tự đổi paid→unpaid)
```

## 8. Unit test bắt buộc (trước khi build UI — mục 9.4 PROJECT.md)

File `lib/billing/__tests__/`:
- `calculate-electricity.test.ts`: phòng thường có thuế; 2 đồng hồ + phụ thu (mặt bằng); 2 đồng hồ + thuế (phòng thường 2 đồng hồ); trường hợp cả hai = 0.
- `calculate-water.test.ts`: cả 3 loại `per_person` / `fixed` / `per_m3`.
- `generate-invoice.test.ts`: tổng hợp đầy đủ, có/không extra_fees pending bị loại, upsert khi đã có invoice unpaid, chặn khi invoice đã paid.

// Build URL ảnh QR chuyển khoản qua VietQR — không cần backend riêng.
// Mục 2 & 6, PROJECT.md: https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.png?amount=...&addInfo=...

export interface BuildVietQrUrlInput {
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template?: string; // mặc định "qr_only" — chỉ hiện mã QR, không hiện khung thông tin người nhận
}

export function buildVietQrUrl(input: BuildVietQrUrlInput): string {
  const template = input.template ?? "qr_only";
  const base = `https://img.vietqr.io/image/${input.bankCode}-${input.accountNo}-${template}.png`;
  const params = new URLSearchParams({
    amount: String(Math.round(input.amount)),
    addInfo: input.addInfo,
    accountName: input.accountName,
  });
  return `${base}?${params.toString()}`;
}

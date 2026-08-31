// Build URL ảnh QR chuyển khoản qua VietQR — không cần backend riêng.
// Mục 2 & 6, PROJECT.md: https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.png?amount=...&addInfo=...

export interface BuildVietQrUrlInput {
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template?: string; // mặc định "compact2"
}

export function buildVietQrUrl(input: BuildVietQrUrlInput): string {
  const template = input.template ?? "compact2";
  const base = `https://img.vietqr.io/image/${input.bankCode}-${input.accountNo}-${template}.png`;
  const params = new URLSearchParams({
    amount: String(Math.round(input.amount)),
    addInfo: input.addInfo,
    accountName: input.accountName,
  });
  return `${base}?${params.toString()}`;
}

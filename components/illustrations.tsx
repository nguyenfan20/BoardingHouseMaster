// Illustration dạng flat SVG theo brand palette — xem .claude/skills/ui-design/references/components.md

export function NoRoomsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chưa có phòng nào">
      <rect x="20" y="80" width="160" height="70" rx="8" fill="#F5F7F2" />
      <rect x="50" y="60" width="100" height="90" rx="6" fill="#FFFFFF" stroke="#DCCCAC" strokeWidth="2" />
      <path d="M40 65 L100 20 L160 65" stroke="#546B41" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="85" y="100" width="30" height="50" rx="3" fill="#E6EBDE" />
      <circle cx="150" cy="45" r="10" fill="#7D9363" />
    </svg>
  );
}

export function NoInvoicesIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chưa có hóa đơn nào">
      <rect x="55" y="20" width="90" height="120" rx="8" fill="#FFFFFF" stroke="#DCCCAC" strokeWidth="2" />
      <rect x="70" y="40" width="60" height="8" rx="4" fill="#E6EBDE" />
      <rect x="70" y="58" width="60" height="8" rx="4" fill="#FBF1E2" />
      <rect x="70" y="76" width="40" height="8" rx="4" fill="#FBF1E2" />
      <circle cx="145" cy="115" r="26" fill="#546B41" />
      <path d="M133 115 L142 124 L158 106" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function NoInvitesIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chưa có link mời nào">
      <circle cx="100" cy="80" r="60" fill="#F5F7F2" />
      <rect x="55" y="60" width="90" height="16" rx="8" fill="#FFFFFF" stroke="#CCD6BD" strokeWidth="2" />
      <circle cx="68" cy="68" r="5" fill="#7D9363" />
      <path d="M100 95 L100 120 M85 108 L100 120 L115 108" stroke="#546B41" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Illustration dùng cho trang login/register
export function AuthIllustration() {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Đăng nhập">
      <rect x="20" y="40" width="200" height="140" rx="16" fill="#F5F7F2" />
      <rect x="60" y="70" width="120" height="80" rx="10" fill="#FFFFFF" stroke="#CCD6BD" strokeWidth="2" />
      <circle cx="120" cy="100" r="16" fill="#7D9363" />
      <rect x="95" y="122" width="50" height="10" rx="5" fill="#E6EBDE" />
      <circle cx="200" cy="50" r="12" fill="#546B41" />
      <circle cx="35" cy="150" r="8" fill="#CCD6BD" />
    </svg>
  );
}

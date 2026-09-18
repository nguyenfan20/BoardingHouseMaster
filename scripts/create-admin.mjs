// Tạo 1 tài khoản admin (dùng được cho production lẫn local) — không đụng tới dữ liệu mẫu
// của scripts/seed-test-accounts.mjs.
//
// Dùng: node --env-file=.env.local scripts/create-admin.mjs [email] [password] [full_name]
// Yêu cầu: .env.local có NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (xem docs/ENV.md),
// trỏ vào đúng project (local hoặc production) muốn tạo admin.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local.");
  process.exit(1);
}

const [email = "admin@86anguyenduy.com", password = "admin123", fullName = "Admin"] = process.argv.slice(2);

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error(`Tạo tài khoản thất bại: ${createError.message}`);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: created.user.id,
    role: "admin",
    room_id: null,
    full_name: fullName,
  });
  if (profileError) {
    console.error(`Tạo user trong Auth thành công nhưng insert vào bảng "users" thất bại: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`Xong. Admin — ${email} / ${password}`);
}

main();

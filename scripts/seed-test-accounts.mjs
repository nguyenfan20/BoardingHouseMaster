// Tạo dữ liệu mẫu + tài khoản test cho môi trường dev (local hoặc project Supabase riêng để test —
// KHÔNG chạy script này nhắm vào project production).
//
// Dùng: npm run seed:accounts
// Yêu cầu: .env.local đã có NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (xem docs/ENV.md),
// và đã áp migrations (`npx supabase db reset` cho local, hoặc `npx supabase db push` cho remote).
//
// Idempotent: chạy lại nhiều lần không tạo trùng — bỏ qua record/tài khoản đã tồn tại.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Tạo .env.local (xem .env.example) rồi chạy lại: npm run seed:accounts"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN = { email: "admin@test.local", password: "Admin@12345", fullName: "Quản lý" };
const TENANTS = [
  { email: "tenant101@test.local", password: "Tenant@12345", fullName: "Tenant Phòng 101", roomName: "Phòng 101" },
  { email: "tenant102@test.local", password: "Tenant@12345", fullName: "Tenant Phòng 102", roomName: "Phòng 102" },
];

async function ensureBankInfo() {
  const { data: existing } = await supabase.from("bank_info").select("id").limit(1).maybeSingle();
  if (existing) return;
  await supabase.from("bank_info").insert({
    bank_code: "970436",
    account_no: "0123456789",
    account_name: "NGUYEN VAN A",
    is_active: true,
  });
  console.log("+ bank_info mẫu");
}

async function ensureRoom(name, roomType, basePrice, numOccupants, config) {
  const { data: existing } = await supabase.from("rooms").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({ name, room_type: roomType, base_price: basePrice, num_occupants: numOccupants })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("billing_config").insert({ room_id: room.id, ...config });
  console.log(`+ room "${name}"`);
  return room.id;
}

async function ensureUser({ email, password, fullName, role, roomId }) {
  // Supabase Admin API không có "get by email" trực tiếp ở mọi version — thử tạo, nếu lỗi trùng
  // email thì coi như đã tồn tại và bỏ qua.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already") || createError.status === 422) {
      console.log(`= tài khoản ${email} đã tồn tại, bỏ qua`);
      return;
    }
    throw createError;
  }

  const { error: profileError } = await supabase.from("users").insert({
    id: created.user.id,
    role,
    room_id: roomId ?? null,
    full_name: fullName,
  });
  if (profileError) throw profileError;

  console.log(`+ tài khoản ${role} — ${email}`);
}

async function main() {
  await ensureBankInfo();

  const room101Id = await ensureRoom("Phòng 101", "normal", 2_500_000, 1, {
    electricity_rate: 3500,
    electricity_tax_percent: 4.5,
    has_dual_meter: false,
    dual_meter_surcharge_percent: 0,
    water_calc_type: "per_person",
    water_rate: 150000,
    allow_tenant_meter_input: true,
  });
  const room102Id = await ensureRoom("Phòng 102", "dual_meter", 3_000_000, 2, {
    electricity_rate: 3500,
    electricity_tax_percent: 4.5,
    has_dual_meter: true,
    dual_meter_surcharge_percent: 0,
    water_calc_type: "per_person",
    water_rate: 150000,
    allow_tenant_meter_input: true,
  });
  const roomIdByName = { "Phòng 101": room101Id, "Phòng 102": room102Id };

  await ensureUser({ ...ADMIN, role: "admin", roomId: null });
  for (const tenant of TENANTS) {
    await ensureUser({ ...tenant, role: "tenant", roomId: roomIdByName[tenant.roomName] });
  }

  console.log("\nXong. Tài khoản test:");
  console.log(`  Admin  — ${ADMIN.email} / ${ADMIN.password}`);
  for (const t of TENANTS) console.log(`  Tenant — ${t.email} / ${t.password} (${t.roomName})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

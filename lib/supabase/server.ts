// Supabase clients dùng ở Server Components / Server Actions.
// - createServerClient: chạy với session của user hiện tại (dựa vào cookies), tôn trọng RLS.
// - createServiceRoleClient: bypass RLS, chỉ dùng cho thao tác nội bộ đã tự kiểm tra role
//   (xem docs/RLS.md § Lưu ý triển khai) — KHÔNG BAO GIỜ import file này vào Client Component.
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Gọi từ Server Component (không phải Server Action/Route Handler) — bỏ qua,
            // middleware sẽ refresh session.
          }
        },
      },
    }
  );
}

export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

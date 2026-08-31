import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: roomCount }, { count: unpaidCount }, { count: pendingFeeCount }] = await Promise.all([
    supabase.from("rooms").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "unpaid"),
    supabase.from("extra_fees").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "Phòng đang hoạt động", value: roomCount ?? 0, href: "/rooms" },
    { label: "Hóa đơn chưa thanh toán", value: unpaidCount ?? 0, href: "/rooms" },
    { label: "Phụ phí chờ duyệt", value: pendingFeeCount ?? 0, href: "/extra-fees-review" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Tổng quan</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-neutral-200 bg-white p-6 transition-colors hover:border-brand-200"
          >
            <p className="text-sm text-neutral-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-700">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

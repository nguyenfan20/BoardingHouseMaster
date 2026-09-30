import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { NoInvoicesIllustration } from "@/components/illustrations";
import { formatMonthLabel } from "@/lib/utils";
import { StatCard, MiniBarChart } from "@/components/tenant-dashboard-charts";
import type { TrendData, BarChartData } from "@/components/tenant-dashboard-charts";
import type { InvoiceBreakdown } from "@/lib/billing/types";

export const dynamic = "force-dynamic";

// ── helpers ──────────────────────────────────────────────────────────────────

function currentMonthIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function prevMonthIso(monthIso: string): string {
  const [y, m] = monthIso.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-1 là tháng hiện tại (0-based), m-2 là tháng trước
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Extract consumed kWh from invoice breakdown */
function getConsumedKwh(breakdown: InvoiceBreakdown): number {
  return breakdown.electricity.consumedKwh;
}

/** Extract water amount from invoice breakdown */
function getWaterUsage(breakdown: InvoiceBreakdown): { value: number; unit: string } {
  if (breakdown.water.calcType === "per_m3" && breakdown.water.consumedM3 != null) {
    return { value: breakdown.water.consumedM3, unit: "m³" };
  }
  return { value: breakdown.water.water, unit: "đ" };
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function TenantInvoicesPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile();
  const roomId = result?.profile.room_id;
  const month = currentMonthIso();
  const prevMonth = prevMonthIso(month);

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("month", { ascending: false });

  // Fetch meter history (last 6 months) for charts
  const [{ data: meterReadings }, { data: waterReadings }] = await Promise.all([
    roomId
      ? supabase
          .from("meter_readings")
          .select("month, meter_type, old_index, new_index")
          .eq("room_id", roomId)
          .order("month", { ascending: false })
          .limit(36) // covers 6 months dual meter
      : Promise.resolve({ data: [] as never[] }),
    roomId
      ? supabase
          .from("water_readings")
          .select("month, old_index, new_index")
          .eq("room_id", roomId)
          .order("month", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  // ── Build trend data from invoices ─────────────────────────────────────────

  // Find current and previous month invoices (by billing month)
  const currentInvoice = invoices?.find((inv) => inv.month <= month);
  const prevInvoice = currentInvoice
    ? invoices?.find((inv) => inv.month < currentInvoice.month)
    : null;

  const currentBreakdown = currentInvoice
    ? (currentInvoice.breakdown as unknown as InvoiceBreakdown)
    : null;
  const prevBreakdown = prevInvoice
    ? (prevInvoice.breakdown as unknown as InvoiceBreakdown)
    : null;

  // Build stat cards
  const statCards: TrendData[] = [];

  if (currentBreakdown) {
    // Tiền điện
    statCards.push({
      label: "Tiêu thụ điện",
      currentValue: getConsumedKwh(currentBreakdown),
      previousValue: prevBreakdown ? getConsumedKwh(prevBreakdown) : null,
      unit: "kWh",
      colorClass: "brand",
    });

    // Tiền nước
    const waterCurrent = getWaterUsage(currentBreakdown);
    const waterPrev = prevBreakdown ? getWaterUsage(prevBreakdown) : null;
    if (waterCurrent.unit === "m³") {
      statCards.push({
        label: "Tiêu thụ nước",
        currentValue: waterCurrent.value,
        previousValue: waterPrev?.unit === "m³" ? waterPrev.value : null,
        unit: "m³",
        colorClass: "info",
      });
    }

    // Tổng hóa đơn
    statCards.push({
      label: "Tổng hóa đơn gần nhất",
      currentValue: currentInvoice!.total_amount,
      previousValue: prevInvoice ? prevInvoice.total_amount : null,
      unit: "đ",
      colorClass: "warning",
    });
  }

  // ── Build bar chart data from meter history ────────────────────────────────

  // Electricity: group by month, sum consumed kWh
  const electricMonths = new Map<string, number>();
  for (const r of meterReadings ?? []) {
    const consumed = r.new_index - r.old_index;
    electricMonths.set(r.month, (electricMonths.get(r.month) ?? 0) + consumed);
  }
  const electricChartItems = [...electricMonths.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, value]) => ({ month, value }));

  const electricChart: BarChartData = {
    label: "Tiêu thụ điện theo tháng (kWh)",
    items: electricChartItems,
    unit: "kWh",
    barColor: "bg-brand-500",
  };

  // Water: if per_m3
  const waterChartItems = (waterReadings ?? [])
    .map((r) => ({ month: r.month, value: r.new_index - r.old_index }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const waterChart: BarChartData | null =
    waterChartItems.length > 0
      ? {
          label: "Tiêu thụ nước theo tháng (m³)",
          items: waterChartItems,
          unit: "m³",
          barColor: "bg-info-600",
        }
      : null;

  // ── Unpaid invoices ────────────────────────────────────────────────────────
  const unpaidInvoices = invoices?.filter((inv) => inv.status === "unpaid") ?? [];
  const paidInvoices = invoices?.filter((inv) => inv.status === "paid") ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Tổng quan</h1>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {statCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <StatCard key={card.label} data={card} />
          ))}
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {(electricChartItems.length > 0 || waterChart) && (
        <div className={`grid gap-3 ${waterChart ? "sm:grid-cols-2" : ""}`}>
          {electricChartItems.length > 0 && <MiniBarChart data={electricChart} />}
          {waterChart && <MiniBarChart data={waterChart} />}
        </div>
      )}

      {/* ── Unpaid invoices (prominent) ────────────────────────────────────── */}
      {unpaidInvoices.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Chưa thanh toán ({unpaidInvoices.length})
          </h2>
          <ul className="space-y-2">
            {unpaidInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} highlight />
            ))}
          </ul>
        </section>
      )}

      {/* ── All invoices ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          {paidInvoices.length > 0 ? "Lịch sử hóa đơn" : "Hóa đơn"}
        </h2>

        {!invoices || invoices.length === 0 ? (
          <EmptyState
            illustration={<NoInvoicesIllustration />}
            title="Chưa có hóa đơn nào"
            description="Hóa đơn hàng tháng sẽ hiện ở đây sau khi quản lý tạo."
          />
        ) : paidInvoices.length === 0 && unpaidInvoices.length > 0 ? (
          <p className="text-sm text-neutral-500">Chưa có hóa đơn nào đã thanh toán.</p>
        ) : (
          <ul className="space-y-2">
            {paidInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── Invoice row component ────────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  highlight = false,
}: {
  invoice: { id: string; month: string; total_amount: number; status: string };
  highlight?: boolean;
}) {
  const isPaid = invoice.status === "paid";
  return (
    <li>
      <Link
        href={`/invoices/${invoice.id}`}
        className={`group flex items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:shadow-sm active:bg-neutral-50 ${
          highlight
            ? "border-warning-600/30 bg-warning-50/50 hover:border-warning-600/50"
            : "border-neutral-200 bg-white hover:border-brand-300"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neutral-900 group-hover:text-brand-700">
            Tháng {formatMonthLabel(invoice.month)}
          </p>
          <p className="mt-0.5 text-sm font-medium text-neutral-600">
            {invoice.total_amount.toLocaleString("vi-VN")} đ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={isPaid ? "paid" : "unpaid"}>
            {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
          </Badge>
          <svg
            className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </Link>
    </li>
  );
}

"use client";

// Chart component cho tenant dashboard — dùng CSS thuần, không cần thư viện bên ngoài.

import { cn } from "@/lib/utils";

export interface TrendData {
  label: string;
  currentValue: number;
  previousValue: number | null; // null = tenant mới, chưa có dữ liệu tháng trước
  unit: string;
  colorClass: string; // VD: "brand" | "info" | "warning"
}

function formatDelta(current: number, previous: number | null): { text: string; type: "up" | "down" | "same" | "new" } {
  if (previous === null) return { text: "Chưa có dữ liệu tháng trước", type: "new" };
  if (previous === 0 && current === 0) return { text: "Không đổi", type: "same" };
  if (previous === 0) return { text: `+${current}`, type: "up" };
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (diff === 0) return { text: "Không đổi", type: "same" };
  if (diff > 0) return { text: `+${diff} (${pct > 0 ? "+" : ""}${pct}%)`, type: "up" };
  return { text: `${diff} (${pct}%)`, type: "down" };
}

// ── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({ data }: { data: TrendData }) {
  const delta = formatDelta(data.currentValue, data.previousValue);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-neutral-600">{data.label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">
        {data.currentValue.toLocaleString("vi-VN")} <span className="text-sm font-medium text-neutral-600">{data.unit}</span>
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {delta.type === "up" && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600">
            <ArrowUp /> {delta.text}
          </span>
        )}
        {delta.type === "down" && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            <ArrowDown /> {delta.text}
          </span>
        )}
        {delta.type === "same" && (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {delta.text}
          </span>
        )}
        {delta.type === "new" && (
          <span className="inline-flex items-center rounded-full bg-info-50 px-2 py-0.5 text-xs font-medium text-info-600">
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Mini Bar Chart ──────────────────────────────────────────────────────────

export interface BarChartData {
  label: string;
  items: { month: string; value: number }[];
  unit: string;
  barColor: string; // tailwind color class like "bg-brand-500"
}

export function MiniBarChart({ data }: { data: BarChartData }) {
  const maxValue = Math.max(...data.items.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-neutral-600">{data.label}</p>
      {data.items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">Chưa có dữ liệu</p>
      ) : (
        <div className="mt-3 flex items-end gap-1.5" style={{ height: 100 }}>
          {data.items.map((item, i) => {
            const heightPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const isLast = i === data.items.length - 1;
            return (
              <div key={item.month} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 z-10 hidden rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-md group-hover:block whitespace-nowrap">
                  {item.value.toLocaleString("vi-VN")} {data.unit}
                </div>
                {/* Bar */}
                <div
                  className={cn(
                    "w-full max-w-[28px] rounded-t-md transition-all duration-500 ease-out",
                    isLast ? data.barColor : "bg-neutral-200"
                  )}
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
                {/* Month label */}
                <p className={cn("mt-1.5 text-[10px]", isLast ? "font-semibold text-neutral-900" : "text-neutral-400")}>
                  {item.month.slice(5, 7)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowUp() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="9" x2="6" y2="3" />
      <polyline points="3 6 6 3 9 6" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="9" />
      <polyline points="3 6 6 9 9 6" />
    </svg>
  );
}

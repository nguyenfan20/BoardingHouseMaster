"use client";

import { useEffect, useState } from "react";

const DAYS_VI = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

export interface LiveDateTimeProps {
  variant?: "header" | "card" | "minimal";
  className?: string;
  showSeconds?: boolean;
}

export function LiveDateTime({
  variant = "header",
  className = "",
  showSeconds = true,
}: LiveDateTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    // Render placeholder matching shape during SSR to prevent layout shift
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50 px-3 py-1 text-xs text-neutral-400 animate-pulse ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span>Đang tải...</span>
      </div>
    );
  }

  const dayName = DAYS_VI[time.getDay()];
  const dateStr = `${String(time.getDate()).padStart(2, "0")}/${String(
    time.getMonth() + 1
  ).padStart(2, "0")}/${time.getFullYear()}`;

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  const timeStr = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;

  if (variant === "card") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-brand-50/80 px-3.5 py-1 text-xs font-medium text-brand-800 shadow-xs backdrop-blur-xs ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
        </span>
        <span>
          {dayName}, {dateStr}
        </span>
        <span className="text-brand-300 font-bold">·</span>
        <span className="font-mono font-semibold text-brand-900 tracking-tight">{timeStr}</span>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-neutral-600 ${className}`}>
        <svg
          className="h-3.5 w-3.5 text-brand-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{dayName}, {dateStr}</span>
        <span className="text-neutral-300">·</span>
        <span className="font-mono font-semibold text-neutral-900">{timeStr}</span>
      </div>
    );
  }

  // Header variant (default)
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-1 text-xs font-medium text-brand-800 shadow-xs transition-colors hover:bg-brand-100/70 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
      </span>
      <span className="hidden sm:inline">
        {dayName},{" "}
      </span>
      <span>{dateStr}</span>
      <span className="text-brand-300 font-bold">·</span>
      <span className="font-mono font-semibold text-brand-900 tracking-tight">{timeStr}</span>
    </div>
  );
}

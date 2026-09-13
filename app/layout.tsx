import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "86A Nguyễn Duy",
  description: "Quản lý nhà trọ 86A Nguyễn Duy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

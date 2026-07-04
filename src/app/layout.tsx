import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "五力指標成績單系統",
  description: "六升七五力指標測驗成績單輸出系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}

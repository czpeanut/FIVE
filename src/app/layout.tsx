import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "補習班自動化功能整合入口",
  description: "補習班自動化功能整合入口：五力指標、模考與學力檢測成績單輸出",
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

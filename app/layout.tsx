import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "狼人杀笔记助手",
  description: "帮助狼人杀玩家快速记录结构化对局信息的桌面笔记工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

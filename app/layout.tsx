import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Đông Hải Open World",
  description: "Khám phá Đông Hải, lái xe và giúp Chú Bảy sửa thuyền.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

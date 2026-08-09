import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANPC 예약 페이지",
  description: "ANPC 미팅 예약 페이지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

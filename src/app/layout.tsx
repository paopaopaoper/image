import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Graduation Art Photo",
  description: "Artistic non-photorealistic graduation photo generator.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}


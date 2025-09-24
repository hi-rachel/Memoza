import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/ui/PwaRegister";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memoza",
  description: "언제 어디서나 당신의 생각을 기록하세요.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: ["/favicon-16x16.png", "/favicon-32x32.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Memoza",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

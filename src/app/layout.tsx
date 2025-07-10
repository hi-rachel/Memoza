import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuthUser";
import { PinProvider } from "@/hooks/usePin";

export const metadata: Metadata = {
  title: "Memoza",
  description: "안전하게 생각을 기록하고 관리하는 공간, Memoza.",
  keywords: ["메모", "노트", "생각 정리", "Memoza", "메모 동기화", "비밀 메모"],
  authors: [{ name: "Raina" }],
  openGraph: {
    title: "Memoza",
    description: "안전하게 생각을 기록하고 관리하는 공간, Memoza.",
    type: "website",
    url: "https://memo-za.vercel.app",
    images: [
      {
        url: "/memoza.png",
        width: 800,
        height: 600,
        alt: "Memoza 로고",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-black min-h-screen">
        <AuthProvider>
          <PinProvider>{children}</PinProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

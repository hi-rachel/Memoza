"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    // 1. PIN 설정 여부 확인
    const pinSet = window.sessionStorage.getItem("memoza_pin_set");
    if (!loading && user && !pinSet) {
      router.replace("/set-pin");
      return;
    }
    // 2. PIN 입력 여부 확인
    const pinEntered = window.sessionStorage.getItem("memoza_pin_entered");
    if (!loading && user && pinSet && !pinEntered) {
      router.replace("/enter-pin");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        로딩 중...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

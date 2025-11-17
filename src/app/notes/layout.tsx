"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, user, loading, router]);

  // 클라이언트에서 마운트되기 전까지는 아무것도 렌더링하지 않음
  if (!mounted) {
    return null;
  }

  // 로딩 중이면 Spinner 표시
  if (loading) {
    return <Spinner fullScreen size="lg" />;
  }

  // 사용자가 없으면 null (리다이렉트는 useEffect에서 처리)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // 로그아웃 시 세션 정리
      router.push("/login");
    } catch {
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 rounded bg-card-bg text-text hover:bg-gray-100 font-semibold ${className}`}
    >
      로그아웃
    </button>
  );
}

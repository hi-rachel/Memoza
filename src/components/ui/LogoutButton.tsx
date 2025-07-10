"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // PIN 관련 sessionStorage 값 초기화
      window.sessionStorage.removeItem("memoza_pin");
      window.sessionStorage.removeItem("memoza_pin_set");
      window.sessionStorage.removeItem("memoza_pin_entered");
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

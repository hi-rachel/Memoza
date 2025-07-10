"use client";

import { useRouter } from "next/navigation";
import PinKeypad from "@/components/ui/PinKeypad";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePin } from "@/hooks/usePin";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sha256 } from "js-sha256";
import { useState } from "react";

export default function EnterPinPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const { setPin } = usePin();
  const [error, setError] = useState("");

  const handlePinConfirmed = async (pin: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const pinHash = userSnap.exists() && userSnap.data().pinHash;
    if (sha256(pin) !== pinHash) {
      setError("비밀번호(PIN)가 올바르지 않습니다.");
      return;
    }
    // PIN 입력 성공 시 전역 상태에 저장
    setPin(pin);
    window.sessionStorage.setItem("memoza_pin_entered", "1");
    setError("");
    router.push("/notes");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">비밀번호(PIN) 입력</h1>
      <PinKeypad onPinConfirmed={handlePinConfirmed} />
      {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import PinKeypad from "@/components/ui/PinKeypad";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePin } from "@/hooks/usePin";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { deriveEncryptionKey } from "@/lib/crypto";
import { sha256 } from "js-sha256";

export default function SetPinPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const { setPin } = usePin();

  const handlePinConfirmed = async (pin: string) => {
    if (!user) return;
    // Firestore에서 userSalt가 이미 있는지 확인
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    let userSalt = userSnap.exists() && userSnap.data().userSalt;
    if (!userSalt) {
      userSalt = uuidv4();
    }
    // PIN 해시 생성 및 저장
    const pinHash = sha256(pin);
    // encryptionKey 생성 (실제 메모 암호화/복호화용)
    await deriveEncryptionKey(user.uid, userSalt, pin); // 필요시 exportKey 등 활용 가능
    // Firestore에 userSalt, pinSet, pinHash 저장 (recoveryKey 제거)
    await setDoc(
      userRef,
      {
        pinSet: true,
        userSalt,
        pinHash,
      },
      { merge: true }
    );
    // PIN 설정 완료 시 전역 상태에 저장
    setPin(pin);
    window.sessionStorage.setItem("memoza_pin_set", "1");
    router.push("/notes");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <PinKeypad onPinConfirmed={handlePinConfirmed} />
    </div>
  );
}

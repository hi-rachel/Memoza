"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        // Firestore에 사용자 정보 저장 (이미 있으면 created_at은 유지)
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            created_at: new Date().toISOString(),
          });
        }
        // Firestore에서 pinSet 여부 확인 후 분기
        const pinSet = userSnap.exists() && userSnap.data().pinSet;
        if (pinSet) {
          router.push("/enter-pin");
        } else {
          router.push("/set-pin");
        }
      }
    } catch {
      alert("로그인에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      (async () => {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const pinSet = userSnap.exists() && userSnap.data().pinSet;
        if (pinSet) {
          router.push("/enter-pin");
        } else {
          router.push("/set-pin");
        }
      })();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 py-10">
      {/* 상단 로고/앱명 */}
      <div className="flex flex-col items-center gap-4 mt-8 mb-10">
        <Image
          src="/memoza.png"
          alt="Memoza 로고"
          width={90}
          height={90}
          className="rounded-2xl shadow-md"
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Memoza
        </h1>
        <p className="text-lg text-gray-600 font-medium mt-2">
          언제 어디서나 당신의 생각을 기록하세요.
        </p>
      </div>
      {/* 로그인 버튼 */}
      <button
        onClick={handleGoogleLogin}
        className="mt-2 px-8 py-3 rounded-full bg-gray-900 text-white text-lg font-bold shadow hover:bg-gray-800 transition"
      >
        Google 계정으로 로그인
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMobileWebView, setIsMobileWebView] = useState(false);
  const { signInWithGoogle, signInWithGithub, signInWithKakao } = useAuthUser();
  const searchParams = useSearchParams();

  // URL에서 오류 파라미터 확인 및 모바일 웹뷰 환경 감지
  useEffect(() => {
    // URL에서 오류 파라미터 확인
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      setError(`로그인 오류: ${errorDescription || errorParam}`);
      setSuccess(""); // 성공 메시지 제거
    }

    // 모바일 웹뷰 환경 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
    const isInAppBrowser = /fbav|instagram|line|wv|micromessenger/i.test(
      userAgent
    );
    setIsMobileWebView(isMobile || isInAppBrowser);
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await signInWithGithub();
      if (error) {
        setError(error.message);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error } = await signInWithKakao();
      if (error) {
        setError(error.message);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* 모바일 웹뷰 안내 */}
      {isMobileWebView && (
        <div className="w-full max-w-md mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📱 모바일 앱에서 접속하신 경우, Google 로그인이 제한될 수 있습니다.
            카카오나 GitHub 로그인을 사용해주세요.
          </p>
        </div>
      )}

      {/* 로그인 버튼들 */}
      <div className="w-full max-w-md space-y-4">
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isMobileWebView ? "opacity-60" : ""
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "로그인 중..." : "Google 로그인"}
        </button>

        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-[#FEE500] text-black hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
          </svg>
          {loading ? "로그인 중..." : "카카오 로그인"}
        </button>

        <button
          onClick={handleGithubLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          {loading ? "로그인 중..." : "GitHub 로그인"}
        </button>
      </div>

      {/* 하단 설명 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>개인 지식 관리 시스템</p>
        <p className="mt-1">간편하게 로그인하고 메모를 시작하세요</p>
      </div>
    </div>
  );
}
